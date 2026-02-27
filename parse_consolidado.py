import pandas as pd
import json

excel_file = 'reports/9. Consolidado de Vendas - 2026 - PECMOTORS.xlsx'

try:
    xl = pd.ExcelFile(excel_file)
    print(f"Sheets: {xl.sheet_names}\n")
    
    for sheet in xl.sheet_names:
        print(f"--- SHEET: {sheet} ---")
        df = pd.read_excel(excel_file, sheet_name=sheet, nrows=20) # Read first 20 rows to understand the structure
        print("Headers/First 5 rows:")
        print(df.head())
        print("------------------------\n")
        
except Exception as e:
    print(f"Error reading excel: {e}")
