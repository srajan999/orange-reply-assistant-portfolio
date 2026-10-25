-- Orange Reply Assistant: quotation report (SYNTHETIC data)
-- Works in SQLite; the same logic ports to PostgreSQL/MySQL with minor changes.
-- Run:  sqlite3 report.db < sql/orange_quotation_report.sql

PRAGMA foreign_keys = ON;

-- ---------- Schema ----------
DROP TABLE IF EXISTS prices;
CREATE TABLE prices (
  item_type TEXT NOT NULL CHECK (item_type IN ('test','panel')),
  name      TEXT PRIMARY KEY,
  price_rs  INTEGER NOT NULL CHECK (price_rs >= 0)
);

DROP TABLE IF EXISTS packages;
CREATE TABLE packages (
  name        TEXT PRIMARY KEY,
  price_rs    INTEGER NOT NULL CHECK (price_rs >= 0),
  has_cbc     TEXT NOT NULL CHECK (has_cbc IN ('Y','N'))
);

DROP TABLE IF EXISTS basket_lines;
CREATE TABLE basket_lines (
  scenario       TEXT NOT NULL,
  test           TEXT NOT NULL REFERENCES prices(name),
  in_indiv       TEXT NOT NULL CHECK (in_indiv IN ('Y','N')),   -- counts in the individual total
  in_quote       TEXT NOT NULL CHECK (in_quote IN ('Y','N')),   -- counts in the quote after roll-up
  covered        TEXT NOT NULL CHECK (covered IN ('Y','N')),    -- covered by the chosen package
  PRIMARY KEY (scenario, test)
);

DROP TABLE IF EXISTS scenario_package;
CREATE TABLE scenario_package (
  scenario     TEXT PRIMARY KEY,
  package_name TEXT REFERENCES packages(name)   -- NULL = no package considered
);

DROP TABLE IF EXISTS rule_tests;
CREATE TABLE rule_tests (
  test_id  TEXT PRIMARY KEY,
  scenario TEXT NOT NULL,
  status   TEXT NOT NULL CHECK (status IN ('PASS','FAIL'))   -- as recorded by npm test
);

DROP TABLE IF EXISTS handling;
CREATE TABLE handling (
  period  TEXT PRIMARY KEY,
  minutes REAL NOT NULL,
  chats   INTEGER,          -- NULL = not recorded
  basis   TEXT NOT NULL
);

-- ---------- Seed data (synthetic prices; handling figures are the author's) ----------
INSERT INTO prices VALUES
 ('test','Sodium',100),('test','Potassium',100),('test','Chloride',100),('test','Calcium',120),
 ('test','Uric Acid',150),('test','Urea',130),('test','Creatinine',140),('test','ALT',160),
 ('test','AST',160),('test','GGT',170),('test','Total Bilirubin',140),('test','Albumin',110),
 ('test','Complete Blood Count',250),('test','Complete Blood Count with ESR',300),
 ('test','Vitamin D',900),('test','Thyroid Profile',800),
 ('panel','Kidney Function Panel',800),('panel','Liver Function Panel',900);

INSERT INTO packages VALUES
 ('Essential Checkup',900,'Y'),
 ('Basic Blood Count',400,'Y'),
 ('Kidney and Liver Checkup',1500,'N');

INSERT INTO basket_lines VALUES
 ('S1 CBC + Vitamin D + Thyroid','Complete Blood Count','Y','Y','Y'),
 ('S1 CBC + Vitamin D + Thyroid','Vitamin D','Y','Y','Y'),
 ('S1 CBC + Vitamin D + Thyroid','Thyroid Profile','Y','Y','N'),
 ('S2 Sodium + Potassium + Vitamin D + Thyroid','Sodium','Y','N','N'),
 ('S2 Sodium + Potassium + Vitamin D + Thyroid','Potassium','Y','N','N'),
 ('S2 Sodium + Potassium + Vitamin D + Thyroid','Vitamin D','Y','Y','Y'),
 ('S2 Sodium + Potassium + Vitamin D + Thyroid','Thyroid Profile','Y','Y','N'),
 ('S2 Sodium + Potassium + Vitamin D + Thyroid','Kidney Function Panel','N','Y','N'),
 ('S3 Vitamin D + Thyroid','Vitamin D','Y','Y','Y'),
 ('S3 Vitamin D + Thyroid','Thyroid Profile','Y','Y','N');

INSERT INTO scenario_package VALUES
 ('S1 CBC + Vitamin D + Thyroid','Essential Checkup'),
 ('S2 Sodium + Potassium + Vitamin D + Thyroid',NULL),
 ('S3 Vitamin D + Thyroid','Essential Checkup');

INSERT INTO rule_tests VALUES
 ('T1','Two parts roll up','PASS'),('T2','Single part not rolled up','PASS'),
 ('T3','Bigger test already requested','PASS'),('T4','Bigger test has no price','PASS'),
 ('T5','CBC covered by CBC with ESR','PASS'),('T6','Cheaper package chosen','PASS'),
 ('T7','Below threshold not optimised','PASS'),('T8','No cheaper option','PASS'),
 ('T9','Unknown price reported','PASS'),('T10','End to end','PASS');

INSERT INTO handling VALUES
 ('Before (informal estimate)', 20, NULL, 'Author''s informal estimate'),
 ('After the change',           10, 100,  'Author''s own records');

-- ---------- Report 1: basket economics (individual vs quote vs best) ----------
-- Threshold is a business setting; 1000 is the illustrative demo value used in the Excel workbook.
WITH params AS (SELECT 1000 AS threshold),
totals AS (
  SELECT bl.scenario,
         SUM(CASE WHEN bl.in_indiv = 'Y' THEN p.price_rs ELSE 0 END) AS individual_rs,
         SUM(CASE WHEN bl.in_quote = 'Y' THEN p.price_rs ELSE 0 END) AS quote_rs,
         SUM(CASE WHEN bl.in_quote = 'Y' AND bl.covered = 'N' THEN p.price_rs ELSE 0 END) AS addons_rs
  FROM basket_lines bl JOIN prices p ON p.name = bl.test
  GROUP BY bl.scenario
),
options AS (
  SELECT t.scenario, t.individual_rs, t.quote_rs, sp.package_name,
         COALESCE(pk.price_rs, 0) + t.addons_rs AS package_option_rs
  FROM totals t
  JOIN scenario_package sp ON sp.scenario = t.scenario
  LEFT JOIN packages pk ON pk.name = sp.package_name
)
SELECT o.scenario,
       o.individual_rs                                   AS individual_rs,
       o.quote_rs                                        AS quote_rs,
       CASE WHEN o.package_name IS NOT NULL
             AND o.quote_rs > (SELECT threshold FROM params)
             AND o.package_option_rs < o.quote_rs
            THEN o.package_option_rs ELSE o.quote_rs END AS best_rs,
       o.quote_rs - CASE WHEN o.package_name IS NOT NULL
             AND o.quote_rs > (SELECT threshold FROM params)
             AND o.package_option_rs < o.quote_rs
            THEN o.package_option_rs ELSE o.quote_rs END AS saving_rs,
       o.quote_rs - o.individual_rs                      AS roll_up_effect_rs
FROM options o
ORDER BY o.scenario;

-- ---------- Report 2: roll-up effect summary ----------
SELECT 'Roll-up increase on S2 (Rs)' AS measure,
       (SELECT quote_rs FROM (
          SELECT SUM(CASE WHEN bl.in_quote='Y' THEN p.price_rs ELSE 0 END) AS quote_rs
          FROM basket_lines bl JOIN prices p ON p.name = bl.test
          WHERE bl.scenario LIKE 'S2%')) -
       (SELECT individual_rs FROM (
          SELECT SUM(CASE WHEN bl.in_indiv='Y' THEN p.price_rs ELSE 0 END) AS individual_rs
          FROM basket_lines bl JOIN prices p ON p.name = bl.test
          WHERE bl.scenario LIKE 'S2%')) AS value_rs;

-- ---------- Report 3: rule-test pass rate ----------
SELECT COUNT(*) FILTER (WHERE status = 'PASS') AS passed,
       COUNT(*) AS total,
       ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'PASS') / COUNT(*), 0) AS pass_rate_pct
FROM rule_tests;

-- ---------- Report 4: handling time before vs after ----------
SELECT a.minutes AS after_min,
       b.minutes AS before_min,
       a.minutes - b.minutes AS change_min,
       ROUND(100.0 * (a.minutes - b.minutes) / b.minutes, 0) AS change_pct,
       a.chats AS chats_after,
       'Observed change; not matched for chat mix or agents' AS caveat
FROM handling a
JOIN handling b ON b.period = 'Before (informal estimate)'
WHERE a.period = 'After the change';

-- ---------- Report 5: package CBC coverage (synthetic package list) ----------
SELECT has_cbc, COUNT(*) AS packages
FROM packages GROUP BY has_cbc ORDER BY has_cbc;
