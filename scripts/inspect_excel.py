import pandas as pd
df = pd.read_excel('Fraud data FY 2023-24 for B&CC.xlsx')
for col in df.columns:
    print(col)
print("---")
print(df.iloc[0].to_dict())
