"""
Migrate articles from old Python SQLite DB to new Node.js SQLite DB.
Sets is_published=1 and language='it' for all articles.
"""
import sqlite3
import json

OLD_DB = r'C:\Users\massi\source\repos\maxange-developer\master_start2impact\backend_old\sql_app.db'
NEW_DB = r'C:\Users\massi\source\repos\maxange-developer\master_start2impact\backend\sql_app.db'

old_conn = sqlite3.connect(OLD_DB)
old_conn.row_factory = sqlite3.Row
old_cur = old_conn.cursor()

new_conn = sqlite3.connect(NEW_DB)
new_cur = new_conn.cursor()

# Check columns in new DB articles table
new_cur.execute("PRAGMA table_info(articles)")
new_cols = [r[1] for r in new_cur.fetchall()]
print('New DB columns:', new_cols)

# Check existing article count in new DB
new_cur.execute("SELECT COUNT(*) FROM articles")
existing = new_cur.fetchone()[0]
print(f'Existing articles in new DB: {existing}')

if existing > 0:
    print('Articles already present, skipping migration.')
    old_conn.close()
    new_conn.close()
    exit(0)

# Fetch all articles from old DB
old_cur.execute("SELECT * FROM articles ORDER BY id")
articles = old_cur.fetchall()
print(f'Found {len(articles)} articles in old DB')

inserted = 0
for art in articles:
    a = dict(art)
    # Map old fields to new fields; add language='it', set is_published=1
    try:
        new_cur.execute("""
            INSERT INTO articles
              (id, title, slug, content, excerpt, category, language,
               image_url, image_slug, images, structured_content,
               author_id, is_published, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            a['id'],
            a['title'],
            a['slug'],
            a['content'],
            a.get('excerpt'),
            a.get('category'),
            'it',                        # language — content is Italian
            a.get('image_url'),
            a.get('image_slug'),
            a.get('images'),             # already a JSON string in SQLite
            a.get('structured_content'), # already a JSON string in SQLite
            a.get('author_id'),
            1,                           # is_published = True
            a.get('created_at'),
        ))
        inserted += 1
    except Exception as e:
        print(f'  ERROR inserting article id={a["id"]}: {e}')

new_conn.commit()
print(f'Migration complete: {inserted} articles inserted.')

# Verify
new_cur.execute("SELECT COUNT(*) FROM articles WHERE is_published=1")
pub = new_cur.fetchone()[0]
print(f'Published articles in new DB: {pub}')

old_conn.close()
new_conn.close()
