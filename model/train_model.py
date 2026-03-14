import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib

# load dataset
df = pd.read_csv("../dataset/tourist_risk_dataset.csv")

# encode text data
state_encoder = LabelEncoder()
desc_encoder = LabelEncoder()

df["state"] = state_encoder.fit_transform(df["state"])
df["description"] = desc_encoder.fit_transform(df["description"])

# features
X = df.drop("risk_score", axis=1)
y = df["risk_score"]

# train test split
X_train, X_test, y_train, y_test = train_test_split(
X, y, test_size=0.2, random_state=42
)

# model
model = RandomForestRegressor(
n_estimators=100,
random_state=42
)

model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)

print("Model Accuracy:", accuracy)

# save model
joblib.dump(model,"risk_model.pkl")
joblib.dump(state_encoder,"state_encoder.pkl")
joblib.dump(desc_encoder,"desc_encoder.pkl")

print("Model Saved Successfully")