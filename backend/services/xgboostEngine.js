import fs from 'fs';
import path from 'path';

/**
 * Motor de Inferencia para XGBoost (Capa 12)
 * Permite "enchufar" modelos pre-entrenados en formato JSON.
 */
class XGBoostEngine {
    constructor(modelPath) {
        try {
            const data = fs.readFileSync(modelPath, 'utf8');
            this.model = JSON.parse(data);
            console.log(`[ML] Modelo cargado: ${this.model.model_name}`);
        } catch (err) {
            console.error("[ML] Error al cargar el modelo XGBoost:", err);
            this.model = null;
        }
    }

    predict(features) {
        if (!this.model) return 0;

        let totalScore = this.model.base_score || 0.5;

        // Recorrer cada árbol del ensamble (en este caso simplificado solo hay 1)
        for (const tree of this.model.trees) {
            totalScore += this.traverse(tree, features);
        }

        // Aplicar Sigmoid para obtener probabilidad 0-1 (Logit Raw to Prob)
        const probability = 1 / (1 + Math.exp(-totalScore));
        return Math.round(probability * 100);
    }

    traverse(node, features) {
        if (node.leaf !== undefined) {
            return node.leaf;
        }

        const featureValue = features[node.split];
        if (featureValue >= node.split_condition) {
            // "yes" en XGBoost suele ser la condición verdadera
            const nextNode = node.children.find(c => c.nodeid === node.yes);
            return this.traverse(nextNode, features);
        } else {
            const nextNode = node.children.find(c => c.nodeid === node.no);
            return this.traverse(nextNode, features);
        }
    }
}

// Singleton para el motor
const modelPath = path.resolve('models/xgboost_readmission.json');
export const predictor = new XGBoostEngine(modelPath);
