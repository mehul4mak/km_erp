{
    "name": "Goods Receipt & Inward Quality",
    "version": "17.0.1.0.0",
    "summary": "Goods Receipt Notes with a mandatory inward quality inspection before stock reaches the store",
    "description": """
Adds a controlled receiving flow on top of Odoo incoming transfers:
- Every vendor receipt (Goods Receipt Note) carries an Inward Quality inspection
- A receipt cannot be posted into the store until the incoming lot is inspected and Accepted
- Rejected lots are held and cannot flow into stock/production
Mirrors the manufacturing quality-gate pattern, applied to inbound goods.
    """,
    "author": "KMatrix AI",
    "category": "Inventory",
    "depends": ["stock", "purchase"],
    "data": ["security/ir.model.access.csv"],
    "license": "LGPL-3",
    "installable": True,
}
