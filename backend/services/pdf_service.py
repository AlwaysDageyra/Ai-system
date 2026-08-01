import pdfplumber
import os

class PDFService:
    @staticmethod
    def extract_text(file_path: str) -> str:
        """Extract all text contents from a PDF file."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        chunks = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    chunks.append(text)
        return "\n\n".join(chunks).strip()
