import sqlite3
conn = sqlite3.connect('instance/procurement.sqlite3')
cur = conn.cursor()
cur.execute('PRAGMA table_info(proposal_requirements)')
print('proposal_requirements:', [r[1] for r in cur.fetchall()])
cur.execute('PRAGMA table_info(tender_requirements)')
print('tender_requirements:', [r[1] for r in cur.fetchall()])
conn.close()
