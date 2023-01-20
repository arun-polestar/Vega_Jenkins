import spacy
import sys
import json

text = sys.argv[1]
name = []
phone = []
data = {
    "candidatename": "",
    "phone": "" 
}

# print (text)
nlp_model = spacy.load('parser')

doc = nlp_model(text)
for ent in doc.ents:
    if ent.label_ == 'candidatename':
        name.append(ent.text)

    if ent.label_ == 'phone':  
        phone.append(ent.text)


if len(name) > 0:
    data['candidatename'] = ",".join(str(x) for x in name)

if len(phone) > 0:
    data['phone'] = ",".join(str(x) for x in phone)

# print(data)
json_data = json.dumps(data) 
print(json_data)