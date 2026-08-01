class AIRequirementService:
    DEFAULT_REQUIREMENTS = ["COMPANY_PROFILE", "TAX_COMPLIANCE", "BANK_STATEMENT"]

    @staticmethod
    def extract_requirements(text: str, use_default_when_empty: bool = False) -> list[str]:
        """
        Naive requirements extraction from text. 
        Later this can be replaced by calling a trained RoBERTa model.
        """
        detected = []
        text_lower = text.lower() if text else ""
        
        # Look for keywords or fallback to a standard mock list
        if "company_profile" in text_lower or "company profile" in text_lower or "profile" in text_lower:
            detected.append("COMPANY_PROFILE")
        if "tax_compliance" in text_lower or "tax compliance" in text_lower or "tax" in text_lower:
            detected.append("TAX_COMPLIANCE")
        if "bank_statement" in text_lower or "bank statement" in text_lower or "bank" in text_lower:
            detected.append("BANK_STATEMENT")
            
        if not detected and use_default_when_empty:
            detected = AIRequirementService.DEFAULT_REQUIREMENTS.copy()
            
        return detected
