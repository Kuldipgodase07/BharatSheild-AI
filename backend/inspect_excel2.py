import pandas as pd
df = pd.read_excel('Fraud data FY 2023-24 for B&CC.xlsx')
with open('output_columns.txt', 'w', encoding='utf-8') as f:
    f.write(str(df.columns.tolist()) + "\\n\\n")
    for key, val in df.iloc[0].to_dict().items():
        f.write(f"{key}: {val}\\n")
