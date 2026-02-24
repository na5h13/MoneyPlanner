"""Categories service — maps Plaid transaction categories to budget envelopes.

Based on Canadian banking patterns (TD, CIBC, Wealthsimple).
"""

# Plaid personal_finance_category.detailed → Budget category
PLAID_TO_BUDGET = {
    # Housing
    "RENT_AND_UTILITIES_RENT": "Rent/Mortgage",
    "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY": "Utilities",
    "RENT_AND_UTILITIES_WATER": "Utilities",
    "RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT": "Utilities",
    "RENT_AND_UTILITIES_TELEPHONE": "Phone & Internet",
    "RENT_AND_UTILITIES_INTERNET_AND_CABLE": "Phone & Internet",
    "HOME_IMPROVEMENT_FURNITURE": "Home",
    "HOME_IMPROVEMENT_HARDWARE": "Home",

    # Transportation
    "TRANSPORTATION_PUBLIC_TRANSIT": "Transit",
    "TRANSPORTATION_TAXIS_AND_RIDE_SHARES": "Transit",
    "TRANSPORTATION_GAS_STATIONS": "Gas",
    "TRANSPORTATION_PARKING": "Parking",
    "TRANSPORTATION_CAR_SERVICE": "Car Maintenance",
    "TRANSPORTATION_CAR_DEALERS_AND_LEASING": "Car Payment",

    # Food
    "FOOD_AND_DRINK_GROCERIES": "Groceries",
    "FOOD_AND_DRINK_RESTAURANTS": "Dining Out",
    "FOOD_AND_DRINK_COFFEE": "Coffee & Snacks",
    "FOOD_AND_DRINK_FAST_FOOD": "Dining Out",
    "FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR": "Alcohol",

    # Shopping
    "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES": "Clothing",
    "GENERAL_MERCHANDISE_ELECTRONICS": "Electronics",
    "GENERAL_MERCHANDISE_DEPARTMENT_STORES": "Shopping",
    "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES": "Shopping",
    "GENERAL_MERCHANDISE_SUPERSTORES": "Shopping",
    "GENERAL_MERCHANDISE_GIFTS_AND_NOVELTIES": "Shopping",

    # Health
    "MEDICAL_DENTIST": "Health",
    "MEDICAL_PHARMACIES_AND_SUPPLEMENTS": "Health",
    "MEDICAL_EYE_CARE": "Health",
    "MEDICAL_VETERINARY_SERVICES": "Pets",

    # Entertainment
    "ENTERTAINMENT_MOVIES_AND_DVDS": "Entertainment",
    "ENTERTAINMENT_MUSIC_AND_AUDIO": "Subscriptions",
    "ENTERTAINMENT_SPORTING_EVENTS": "Entertainment",
    "ENTERTAINMENT_TV_AND_MOVIES": "Subscriptions",
    "ENTERTAINMENT_VIDEO_GAMES": "Entertainment",
    "RECREATION_GYMS_AND_FITNESS_CENTERS": "Fitness",

    # Personal
    "PERSONAL_CARE_HAIR_AND_BEAUTY": "Personal Care",
    "PERSONAL_CARE_LAUNDRY_AND_DRY_CLEANING": "Personal Care",

    # Insurance
    "LOAN_PAYMENTS_CAR_PAYMENT": "Car Payment",
    "LOAN_PAYMENTS_INSURANCE": "Insurance",
    "LOAN_PAYMENTS_STUDENT_LOAN": "Debt Payment",
    "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT": "Debt Payment",

    # Income
    "INCOME_WAGES": "Income",
    "INCOME_DIVIDENDS": "Income",
    "INCOME_INTEREST_EARNED": "Income",
    "INCOME_RETIREMENT_PENSION": "Income",
    "INCOME_TAX_REFUND": "Income",
    "INCOME_OTHER_INCOME": "Income",

    # Transfers
    "TRANSFER_INTERNAL_ACCOUNT_TRANSFER": "Transfers",
    "TRANSFER_ACH": "Transfers",
    "TRANSFER_WIRE": "Transfers",
    "TRANSFER_DEBIT": "E-Transfers In",
    "TRANSFER_CREDIT": "E-Transfers In",
    "TRANSFER_THIRD_PARTY_VENMO": "E-Transfers In",
}

# Merchant name overrides (higher priority than Plaid category)
MERCHANT_OVERRIDES = {
    "INTERAC E-TRANSFER": "E-Transfers In",
    "E-TRANSFER": "E-Transfers In",
    "PAYROLL": "Income",
    "DIRECT DEP": "Income",
    "NETFLIX": "Subscriptions",
    "SPOTIFY": "Subscriptions",
    "DISNEY PLUS": "Subscriptions",
    "AMAZON PRIME": "Subscriptions",
    "APPLE.COM/BILL": "Subscriptions",
    "GOOGLE *": "Subscriptions",
    "YOUTUBE PREMIUM": "Subscriptions",
    "UBER EATS": "Dining Out",
    "DOORDASH": "Dining Out",
    "SKIP THE DISHES": "Dining Out",
    "TIM HORTONS": "Coffee & Snacks",
    "STARBUCKS": "Coffee & Snacks",
    "COSTCO": "Groceries",
    "WALMART": "Groceries",
    "LOBLAWS": "Groceries",
    "NO FRILLS": "Groceries",
    "METRO": "Groceries",
    "PRESTO": "Transit",
    "TTC": "Transit",
    "UBER TRIP": "Transit",
    "LYFT": "Transit",
    "ESSO": "Gas",
    "PETRO-CANADA": "Gas",
    "SHELL": "Gas",
    "CANADIAN TIRE": "Home",
    "REXALL": "Health",
    "SHOPPERS DRUG": "Health",
    "WINNERS": "Clothing",
    "GYM": "Fitness",
    "GOODLIFE": "Fitness",
}

# Budget envelopes — groups of categories for display
BUDGET_ENVELOPES = [
    {
        "name": "Housing",
        "categories": ["Rent/Mortgage", "Utilities", "Phone & Internet", "Home", "Insurance"],
    },
    {
        "name": "Transportation",
        "categories": ["Transit", "Gas", "Parking", "Car Maintenance", "Car Payment"],
    },
    {
        "name": "Food & Dining",
        "categories": ["Groceries", "Dining Out", "Coffee & Snacks", "Alcohol"],
    },
    {
        "name": "Health & Fitness",
        "categories": ["Health", "Fitness", "Pets", "Personal Care"],
    },
    {
        "name": "Lifestyle",
        "categories": [
            "Shopping", "Clothing", "Electronics", "Entertainment",
            "Subscriptions",
        ],
    },
    {
        "name": "Financial",
        "categories": ["Debt Payment", "Savings", "Investments"],
    },
]


def map_category(txn: dict) -> str:
    """Map a transaction to a budget category.

    Priority: merchant override > Plaid category mapping > fallback.
    """
    name = (txn.get("name") or "").upper()
    merchant = (txn.get("merchant") or "").upper()
    plaid_cat = (txn.get("category") or "").upper().replace(" ", "_")

    # 1. Check merchant overrides
    for pattern, budget_cat in MERCHANT_OVERRIDES.items():
        if pattern in merchant or pattern in name:
            return budget_cat

    # 2. Check Plaid category mapping
    for plaid_key, budget_cat in PLAID_TO_BUDGET.items():
        if plaid_key in plaid_cat:
            return budget_cat

    # 3. Income detection by amount (negative = money in)
    if txn.get("amount", 0) < 0:
        if abs(txn["amount"]) > 500:
            return "Income"
        return "E-Transfers In"

    # 4. Fallback
    return "Other"
