import sys
sys.stdout.reconfigure(encoding='utf-8')
from app.services.brain import brain_service

print("Looking up Gadhada I 38...")
res = brain_service.collection.get(
    where={"$and": [{"chapter": "Gadhada"}, {"vachanamrut_no": 38}]}
)

print(f"Total chunks found: {len(res['ids'])}")
for i in range(len(res['ids'])):
    print(f"\nChunk ID: {res['ids'][i]}")
    print("Metadata:", res['metadatas'][i])
    print("Text snippet:", res['documents'][i][:300])
