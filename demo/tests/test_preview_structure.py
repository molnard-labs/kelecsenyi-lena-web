"""Verify the explicit boundary: preserve homepage, add one separate-page CTA."""
from html.parser import HTMLParser
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[1]


class TextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text=[]
    def handle_data(self,data):
        self.text.append(data.strip())


def sections(path):
    text=path.read_text(encoding='utf-8')
    result={}
    for match in re.finditer(r'<section id="([^"]+)"[^>]*>(.*?)</section>',text,re.S):
        if match[1]=='intro':
            continue
        content=re.sub(r'<p class="quick-reading-cta">.*?</p>','',match[2],flags=re.S)
        parser=TextParser()
        parser.feed(content)
        result[match[1]]=' '.join(' '.join(parser.text).split())
    return result


class PreviewStructureTests(unittest.TestCase):
    def test_original_sections_and_copy_preserved(self):
        original=sections(ROOT/'original-page.html')
        current=sections(ROOT/'index.html')
        self.assertGreaterEqual(len(original),7)
        self.assertEqual(list(original),list(current))
        self.assertEqual(original,current)

    def test_only_one_homepage_cta_and_no_birth_form(self):
        text=(ROOT/'index.html').read_text(encoding='utf-8')
        self.assertEqual(text.count('href="/gyors-elemzes/"'),1)
        self.assertNotIn('id="birth-form"',text)
        self.assertNotIn('<video',text)
        self.assertIn('celestial-galaxy',text)
        self.assertNotIn('celestial-toggle',text)
        self.assertNotIn('Animáció szüneteltetése',text)

    def test_intro_has_clear_way_to_original_introductory_section(self):
        text=(ROOT/'index.html').read_text(encoding='utf-8')
        intro=text.split('<section id="intro"',1)[1].split('</section>',1)[0]
        self.assertRegex(intro,r'<h1>Kelecsényi Léna</h1>\s*<a class="intro-scroll-link" href="#hero">Tovább az oldalra')
        self.assertIn('<svg ',intro)
        self.assertIn('Önismeret asztrológiai szemlélettel',sections(ROOT/'index.html')['hero'])

    def test_consultation_is_above_optional_technical_details(self):
        text=(ROOT/'gyors-elemzes/index.html').read_text(encoding='utf-8')
        result=text.split('<section id="chart-result"',1)[1].split('</section>',1)[0]
        self.assertRegex(result,r'<div id="chart-wheel"></div>\s*<aside class="consultation-quick"')
        self.assertEqual(result.count('class="primary-button consultation-button"'),2)
        self.assertLess(result.index('class="consultation-invitation"'),result.index('id="positions-details"'))
        self.assertLess(result.index('class="result-actions"'),result.index('id="positions-details"'))
        self.assertRegex(result,r'</details>\s*$')

    def test_separate_page_has_real_inputs_and_no_remote_embed(self):
        text=(ROOT/'gyors-elemzes/index.html').read_text(encoding='utf-8')
        for name in ('birth-date','birth-time','birth-place','chart-result'):
            self.assertIn(f'id="{name}"',text)
        self.assertNotIn('<iframe',text)
        self.assertNotIn('fonts.googleapis.com',text)
        self.assertIn('Swiss Ephemeris',text)
        self.assertIn('GeoNames',text)


if __name__=='__main__':
    unittest.main()
