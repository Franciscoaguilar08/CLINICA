UPDATE patients 
SET risk_score = 0, risk_level = NULL 
WHERE created_by IS NULL;
