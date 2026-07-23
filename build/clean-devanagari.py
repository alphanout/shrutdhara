import glob
import re

def clean_text(text):
    # remove stray headings containing only quote or space
    text = re.sub(r'^##\s*[’\'`\s]+$\n?', '', text, flags=re.MULTILINE)
    
    # legacy font fixes
    text = text.replace('म्ोक्षमार्गप्रकाशक', 'मोक्षमार्गप्रकाशक')
    text = text.replace('च्ौथा', 'चौथा')
    text = text.replace('पण्िडत', 'पंडित')
    text = text.replace('अखण्िडत', 'अखंडित')
    text = text.replace('परमेष्िट', 'परमेष्टि')
    text = text.replace('¹ष्िट', 'दृष्टि')
    text = text.replace('ñदय', 'हृदय')
    text = text.replace('द्व्रेष', 'द्वेष')
    text = text.replace('ग््रंथ', 'ग्रंथ')
    text = text.replace('स्ौत्रांतिक', 'सौत्रांतिक')
    text = text.replace('नश्चल', 'निश्चल')
    text = text.replace('भााव', 'भाव')
    text = text.replace('साावधान', 'सावधान')
    text = text.replace('बाारह', 'बारह')
    text = text.replace('संंभव', 'संभव')
    text = text.replace('ि़', 'ि')
    
    # general regex for consonant + halant + voweled matra -> consonant + voweled matra
    text = re.sub(r'([क-ह])्([ा-ौ])', r'\1\2', text)
    # double ra-kar like ग + ् + ्र -> ग्र
    text = re.sub(r'([क-ह])््र', r'\1्र', text)
    
    return text

def main():
    count = 0
    for f in sorted(glob.glob('shastra/*.md')):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        cleaned = clean_text(content)
        if cleaned != content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(cleaned)
            print(f'Cleaned Devanagari in {f}')
            count += 1
    print(f'Total files cleaned: {count}')

if __name__ == '__main__':
    main()
