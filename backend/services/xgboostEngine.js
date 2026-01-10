import fs from 'fs';
import path from 'path';

/**
 * Motor de Inferencia para XGBoost (Capa 12)
 * Permite "enchufar" modelos pre-entrenados en formato JSON.
 */
class XGBoostEngine {
    constructor(modelPath) {
        this.modelPath = modelPath;
        this.loadModel();

        // 2. HOT-RELOADING (Zombie Killer)
        // Watch for file changes and reload automatically
        fs.watch(this.modelPath, (eventType) => {
            if (eventType === 'change') {
                console.log("[ML] Detectado cambio en modelo. Recargando...");
                // Debounce simple para evitar lecturas dobles
                setTimeout(() => this.loadModel(), 100);
            }
        });
    }

    loadModel() {
        try {
            const data = fs.readFileSync(this.modelPath, 'utf8');
            this.model = JSON.parse(data);
            console.log(`[ML] Modelo cargado/actualizado: ${this.model.model_name} @ ${new Date().toISOString()}`);
        } catch (err) {
            console.error("[ML] Error al cargar el modelo XGBoost:", err);
            // Non-blocking error, keep old model if possible or null
        }
    }

    // 1. REAL XAI (No more Fake Ifs)
    // Returns { score, contributions }
    predictWithExplanation(features) {
        if (!this.model) return { score: 0, drivers: [] };

        let totalScore = this.model.base_score || 0.5;
        let featureImpacts = {};

        // Initialize impacts
        for (const key of Object.keys(features)) featureImpacts[key] = 0;

        for (const tree of this.model.trees) {
            const { leafValue, path } = this.traverseWithPath(tree, features);
            totalScore += leafValue;

            // Distribute leaf weight to features used in the path
            // (Simplified TreeSHAP: Uniform split of credit)
            const weightPerFeature = path.length > 0 ? leafValue / path.length : 0;
            path.forEach(feature => {
                if (!featureImpacts[feature]) featureImpacts[feature] = 0;
                featureImpacts[feature] += weightPerFeature;
            });
        }

        const probability = 1 / (1 + Math.exp(-totalScore));
        const finalScore = Math.round(probability * 100);

        // Convert impacts to Drivers format
        // Filter only positive contributors to risk
        const drivers = Object.entries(featureImpacts)
            .filter(([_, val]) => val > 0)
            .sort((a, b) => b[1] - a[1]) // Top contributors first
            .map(([feature, val]) => ({
                factor: feature,
                impact: val > 0.5 ? 'Critical' : (val > 0.2 ? 'High' : 'Medium'),
                raw_contribution: val.toFixed(4)
            }))
            .slice(0, 3); // Top 3 drivers

        return { score: finalScore, drivers };
    }

    predict(features) {
        return this.predictWithExplanation(features).score;
    }

    traverseWithPath(node, features) {
        if (node.leaf !== undefined) {
            return { leafValue: node.leaf, path: [] };
        }

        const featureValue = features[node.split];
        // Track that this feature was used in decision
        let result;
        if (featureValue >= node.split_condition) {
            const nextNode = node.children.find(c => c.nodeid === node.yes);
            result = this.traverseWithPath(nextNode, features);
        } else {
            const nextNode = node.children.find(c => c.nodeid === node.no);
            result = this.traverseWithPath(nextNode, features);
        }

        // Append current feature to the path bubble-up
        return {
            leafValue: result.leafValue,
            path: [node.split, ...result.path]
        };
    }

    getMetadata() {
        if (!this.model) return { name: 'Unloaded', version: '0.0', trained: null };
        return {
            name: this.model.model_name || 'Generic XGBoost',
            version: this.model.version || '1.0',
            trained: this.model.last_trained
        };
    }
}

// Singleton para el motor
const modelPath = path.resolve('models/xgboost_readmission.json');
export const predictor = new XGBoostEngine(modelPath);
