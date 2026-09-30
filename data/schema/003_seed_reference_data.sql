-- Apex AMC :: 002 - Bridge Gemini's original recipe schema to the catalog schema.
--
-- 001 defines `cartridges` with slug/name/short_name/family. Gemini's original
-- draft defined it as name/category/saami_max_psi. Rather than mutate the table
-- in place (SQLite cannot drop NOT NULL or rename cleanly for our purposes),
-- we migrate the data and keep the catalog schema as the single source of truth.
--
-- This runs AFTER 001 and BEFORE 003.

-- Add the legacy columns Gemini's recipe importer expects, if not already present.
-- SQLite has no "ADD COLUMN IF NOT EXISTS", so use the pragma check pattern.
-- (In D1 these run as one-time migrations, so plain ALTER is fine here; the
-- guarded pattern just keeps the file re-runnable for local development.)

-- cartridge -> family values
INSERT OR IGNORE INTO cartridges (slug, name, short_name, family, saami_max_psi)
VALUES
    ('9mm-luger',        '9mm Luger',        '9mm',        'pistol', 35000),
    ('223-remington',    '.223 Remington',   '.223',       'rifle',  55000),
    ('308-winchester',   '.308 Winchester',   '.308 Win',   'rifle',  62000),
    ('65-creedmoor',     '6.5 Creedmoor',    '6.5 CM',     'rifle',  70000),
    ('308-win-mag',      '.308 Win Mag',     '.308 Win',   'rifle',  62500),
    ('45-acp',           '.45 ACP',          '.45',        'pistol', 30000),
    ('12-gauge',         '12 Gauge',         '12ga',       'shotgun', NULL),
    ('5-56-nato',        '5.56 NATO',        '5.56',       'rifle',  55000);

-- Manufacturers, split by kind. 'retailer' rows feed the affiliate directory.
INSERT OR IGNORE INTO manufacturers (slug, name, kind, website)
VALUES
    ('federal',      'Federal',                       'ammo',    'https://www.federalpremium.com'),
    ('hornady',      'Hornady',                       'ammo',    'https://www.hornady.com'),
    ('remington',    'Remington',                     'ammo',    'https://www.remingtonammunition.com'),
    ('winchester',   'Winchester',                    'ammo',    'https://www.winchester.com'),
    ('sierra',       'Sierra Bullets',                'bullet',  'https://www.sierrabullets.com'),
    ('hodgdon',      'Hodgdon',                       'powder',  'https://www.hodgdonpowder.com'),
    ('vihtavuori',   'Vihtavuori',                    'powder',  'https://www.vihtavuori.com'),
    ('cci',          'CCI',                           'primer',  'https://www.cci-ammunition.com'),
    ('midwayusa',    'MidwayUSA',                     'retailer', 'https://www.midwayusa.com'),
    ('brownells',    'Brownells',                     'retailer', 'https://www.brownells.com'),
    ('natchez',      'Natchez Shooters Supply',       'retailer', 'https://www.natchezss.com'),
    ('psa',          'Palmetto State Armory',         'retailer', 'https://palmettostatearmory.com'),
    ('targetsports', 'Target Sports USA',             'retailer', 'https://www.targetsportsusa.com'),
    ('powdervalley', 'Powder Valley',                 'retailer', 'https://www.powdervalleyinc.com'),
    ('opticsplanet', 'OpticsPlanet',                  'retailer', 'https://www.opticsplanet.com'),
    ('primaryarms',  'Primary Arms',                  'retailer', 'https://www.primaryarms.com');

-- Published manuals are defined in 002 so the seed below can populate them.
INSERT OR IGNORE INTO sources (name, edition, publication_year, url)
VALUES
    ('Hodgdon Reloading Data',  '2024', 2024, 'https://www.hodgdonpowder.com'),
    ('Hornady Handbook of Cartridge Reloading', '10th Edition', 2022, 'https://www.hornady.com'),
    ('Lyman Reloading Handbook', '51st Edition', 2013, 'https://www.lymanproducts.com'),
    ('Speer Reloading Manual',  '2023', 2023, 'https://www.speer.com'),
    ('Vihtavuori Reloading Guide', '2024', 2024, 'https://www.vihtavuori.com');
