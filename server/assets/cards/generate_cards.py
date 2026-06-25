#!/usr/bin/env python3
"""
Generate restaurant table card docx.
Uses file1/cell0 as template for each card, replacing only text nodes.
Usage: python generate_cards.py '[{"zh":"胡麻醬","zh_tag":"(葷)","en":"Sesame Dressing","en_tag":"(Non-Veg)","count":2},...]' output.docx
"""
import sys, json, os, re, zipfile

SCRIPT_DIR = os.environ.get("DOCX_DIR", os.path.dirname(os.path.abspath(__file__)))

# Template source: file1 cell0 (胡麻醬) — has all 4 text slot types
TEMPLATE_FILE = 1
TEMPLATE_CELL = 0
TEMPLATE_ZH_MAIN = '胡麻醬'
TEMPLATE_ZH_TAG  = '(葷)'
TEMPLATE_EN_MAIN = 'Sesame Dressing'
TEMPLATE_EN_TAG  = '(Non-Veg)'

def load_xml(docx_path):
    with zipfile.ZipFile(docx_path, 'r') as z:
        return z.read('word/document.xml').decode('utf-8')

def extract_cells(xml):
    cells = []
    i = 0
    while i < len(xml):
        start = xml.find('<w:tc', i)
        if start == -1: break
        if xml[start+5:start+6] not in ('>', ' ', '\n', '\r', '\t'):
            i = start + 1; continue
        depth = 0; j = start
        while j < len(xml):
            if xml[j:j+5] == '<w:tc' and xml[j+5:j+6] in ('>', ' ', '\n', '\r', '\t'):
                depth += 1; j = xml.find('>', j) + 1
            elif xml[j:j+7] == '</w:tc>':
                depth -= 1
                if depth == 0: cells.append(xml[start:j+7]); i = j+7; break
                j += 7
            else: j += 1
        else: break
    return cells

def xml_escape(text):
    """Escape special XML characters."""
    return (text
        .replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .replace('"', '&quot;'))

def replace_texts(cell_xml, replacements):
    """Replace text inside <w:t> nodes. Each old→new pair replaces ALL occurrences."""
    result = cell_xml
    for old, new in replacements.items():
        if old == '':
            continue
        result = re.sub(
            r'(<w:t[^>]*>)' + re.escape(old) + r'(</w:t>)',
            lambda m, n=xml_escape(new): m.group(1) + n + m.group(2),
            result
        )
    return result

def get_red_run(xml):
    pos = xml.find('C00000')
    if pos == -1: return None
    r_start = xml.rfind('<w:r', 0, pos)
    while r_start >= 0 and xml[r_start+4:r_start+5] not in ('>', ' ', '\n', '\r', '\t'):
        r_start = xml.rfind('<w:r', 0, r_start)
    r_end = xml.find('</w:r>', pos) + 6
    return xml[r_start:r_end]

def remove_red_run(cell_xml):
    pos = cell_xml.find('C00000')
    if pos == -1: return cell_xml
    r_start = cell_xml.rfind('<w:r', 0, pos)
    while r_start >= 0 and cell_xml[r_start+4:r_start+5] not in ('>', ' ', '\n', '\r', '\t'):
        r_start = cell_xml.rfind('<w:r', 0, r_start)
    r_end = cell_xml.find('</w:r>', pos) + 6
    return cell_xml[:r_start] + cell_xml[r_end:]

def add_red_run(cell_xml, red_run, spid_offset):
    unique_run = re.sub(
        r'(o:spid="_x0000_s)(\d+)"',
        lambda m: m.group(1) + str(int(m.group(2)) + spid_offset) + '"',
        red_run
    )
    insert_at = cell_xml.rfind('</w:p>')
    return cell_xml[:insert_at] + unique_run + cell_xml[insert_at:]

def reassign_ids(cell_xml, id_counter):
    result = []
    pos = 0
    for m in re.finditer(r'(<wp:docPr\b[^>]*\bid=")(\d+)(")', cell_xml):
        result.append(cell_xml[pos:m.start(2)])
        result.append(str(id_counter[0]))
        id_counter[0] += 1
        pos = m.end(2)
    result.append(cell_xml[pos:])
    return ''.join(result)

def fix_alignment(cell_xml):
    def fix_tbox(m):
        tbox = m.group(0)
        tbox = re.sub(r'<w:pPr>(?!.*?<w:jc)', '<w:pPr><w:jc w:val="center"/>', tbox, flags=re.DOTALL)
        tbox = re.sub(r'<w:jc w:val="[^"]+"/>', '<w:jc w:val="center"/>', tbox)
        return tbox
    return re.sub(r'<w:txbxContent>.*?</w:txbxContent>', fix_tbox, cell_xml, flags=re.DOTALL)

def make_card_cell(zh, zh_tag, en, en_tag, template_cell):
    """Create a cell from template by replacing text nodes."""
    cell = replace_texts(template_cell, {
        TEMPLATE_ZH_MAIN: zh,
        TEMPLATE_ZH_TAG:  zh_tag,
        TEMPLATE_EN_MAIN: en,
        TEMPLATE_EN_TAG:  en_tag,
    })
    cell = fix_alignment(cell)
    return cell

def build_docx(card_defs, output_path):
    # Load template cell (file1 cell0)
    src1 = os.path.join(SCRIPT_DIR, '餐廳桌牌-1.docx')
    base_xml = load_xml(src1)
    all_cells_src = extract_cells(base_xml)
    template_cell_with_red = all_cells_src[TEMPLATE_CELL]

    # Get red bar run
    red_run = get_red_run(template_cell_with_red)
    template_cell = remove_red_run(template_cell_with_red)

    # Build all card cells (expanded by count)
    all_cards = []
    for card in card_defs:
        cell = make_card_cell(
            card.get('zh', ''),
            card.get('zh_tag', ''),
            card.get('en', ''),
            card.get('en_tag', ''),
            template_cell
        )
        for _ in range(card.get('count', 1)):
            all_cards.append(cell)

    if not all_cards:
        print('No cards', file=sys.stderr)
        return False

    # Arrange into rows of 3, adding red bar to col-0 of each row
    id_counter = [1]
    spid = 1000
    all_cells_out = []
    for idx, cell in enumerate(all_cards):
        col = idx % 3
        if col == 0 and red_run:
            cell = add_red_run(cell, red_run, spid)
            spid += 1000
        cell = reassign_ids(cell, id_counter)
        all_cells_out.append(cell)

    # Pad last row to multiple of 3 with empty cells
    while len(all_cells_out) % 3 != 0:
        empty = make_card_cell('', '', '', '', template_cell)
        all_cells_out.append(reassign_ids(empty, id_counter))

    # Build document XML
    trpr_m = re.search(r'<w:trPr>.*?</w:trPr>', base_xml, re.DOTALL)
    trpr = trpr_m.group(0) if trpr_m else ''
    header = re.search(r'^(.*?)<w:tr[ >]', base_xml, re.DOTALL).group(1)
    footer = base_xml[base_xml.rfind('</w:tr>') + 7:]

    rows_xml = ''
    n_rows = len(all_cells_out) // 3
    for r in range(n_rows):
        chunk = all_cells_out[r*3:r*3+3]
        rows_xml += '<w:tr w:rsidR="00EA1925" w:rsidTr="00EA1925">' + trpr
        rows_xml += ''.join(chunk)
        rows_xml += '</w:tr>'

    new_doc_xml = (header + rows_xml + footer).encode('utf-8')

    with zipfile.ZipFile(src1, 'r') as src:
        with zipfile.ZipFile(output_path, 'w') as dst:
            for item in src.infolist():
                if item.filename == 'word/document.xml':
                    dst.writestr(item, new_doc_xml)
                else:
                    dst.writestr(item, src.read(item.filename))

    return True

if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1] == '--setup':
        sys.exit(0)
    card_defs = json.loads(sys.argv[1])
    output = sys.argv[2]
    sys.exit(0 if build_docx(card_defs, output) else 1)