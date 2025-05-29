/*
  # Add sample deal data

  1. New Data
    - Adds sample deal data for 3819 GREENRIDGE dr
    - Creates sections with realistic property analysis data
    
  2. Changes
    - Inserts deal record
    - Adds corresponding deal sections with analysis data
*/

-- Insert the deal if it doesn't exist
INSERT INTO deals (id, address, investor_id, status, progress)
SELECT 
  gen_random_uuid(),
  '3819 GREENRIDGE dr',
  (SELECT id FROM users WHERE role = 'investor' LIMIT 1),
  'completed',
  100
WHERE NOT EXISTS (
  SELECT 1 FROM deals WHERE address = '3819 GREENRIDGE dr'
)
RETURNING id INTO deal_id;

-- Sourcing Section
INSERT INTO deal_sections (deal_id, type, data, completed)
VALUES (
  (SELECT id FROM deals WHERE address = '3819 GREENRIDGE dr'),
  'sourcing',
  '{
    "listingPrice": "425000",
    "currentRents": "3200",
    "comps": "3725 Greenridge Dr - Sold $445,000\n3901 Greenridge Dr - Sold $432,000\n3855 Greenridge Dr - Listed $449,900"
  }'::jsonb,
  true
);

-- Financial Section
INSERT INTO deal_sections (deal_id, type, data, completed)
VALUES (
  (SELECT id FROM deals WHERE address = '3819 GREENRIDGE dr'),
  'financial',
  '{
    "purchasePrice": "425000",
    "downPayment": "85000",
    "loanAmount": "340000",
    "interestRate": "6.25",
    "loanTerm": "30",
    "monthlyRent": "3200",
    "propertyTax": "4800",
    "insurance": "1800",
    "maintenance": "3600",
    "vacancyRate": "5",
    "managementFee": "8",
    "monthlyExpenses": "1850",
    "netOperatingIncome": "28560",
    "capRate": "6.72",
    "cashOnCashReturn": "12.4"
  }'::jsonb,
  true
);

-- Rehab Section
INSERT INTO deal_sections (deal_id, type, data, completed)
VALUES (
  (SELECT id FROM deals WHERE address = '3819 GREENRIDGE dr'),
  'rehab',
  '{
    "estimates": [
      {
        "category": "Kitchen",
        "description": "Full kitchen remodel including new appliances",
        "cost": 15000,
        "timeframe": 14
      },
      {
        "category": "Bathrooms",
        "description": "Update two bathrooms",
        "cost": 8000,
        "timeframe": 10
      },
      {
        "category": "Flooring",
        "description": "New hardwood throughout main level",
        "cost": 12000,
        "timeframe": 7
      }
    ],
    "contractors": [
      {
        "name": "Premier Renovations",
        "specialty": "General Contractor",
        "rating": 4.8,
        "contactInfo": "555-0123",
        "estimatedCost": 35000,
        "estimatedTime": "4-5 weeks"
      }
    ],
    "totalCost": 35000,
    "estimatedTimeframe": 35
  }'::jsonb,
  true
);

-- Legal Section
INSERT INTO deal_sections (deal_id, type, data, completed)
VALUES (
  (SELECT id FROM deals WHERE address = '3819 GREENRIDGE dr'),
  'legal',
  '{
    "titleCompany": "Secure Title LLC",
    "titleSearchStatus": "completed",
    "purchaseAgreement": {
      "status": "approved",
      "notes": "Clean purchase agreement, standard terms"
    },
    "titleInsurance": {
      "status": "received",
      "provider": "First American Title",
      "policyNumber": "TAP-2024-45678",
      "coverage": 425000
    },
    "legalReview": {
      "status": "completed",
      "findings": [
        "Clear title history",
        "No liens or encumbrances",
        "Zoning compliance confirmed"
      ],
      "recommendations": [
        "Proceed with standard closing process",
        "Maintain standard insurance coverage"
      ]
    }
  }'::jsonb,
  true
);

-- Financing Section
INSERT INTO deal_sections (deal_id, type, data, completed)
VALUES (
  (SELECT id FROM deals WHERE address = '3819 GREENRIDGE dr'),
  'financing',
  '{
    "loanType": "Conventional",
    "lender": "Regional Bank",
    "loanAmount": 340000,
    "interestRate": 6.25,
    "termYears": 30,
    "monthlyPayment": 2094,
    "closingCosts": 12500,
    "requiredReserves": 15000,
    "conditions": [
      "20% down payment required",
      "Proof of rental income history",
      "Property insurance required"
    ]
  }'::jsonb,
  true
);

-- Marketplace Section
INSERT INTO deal_sections (deal_id, type, data, completed)
VALUES (
  (SELECT id FROM deals WHERE address = '3819 GREENRIDGE dr'),
  'marketplace',
  '{
    "comparableProperties": [
      {
        "address": "3725 Greenridge Dr",
        "price": 445000,
        "sqft": 2200,
        "pricePerSqft": 202,
        "daysOnMarket": 45
      },
      {
        "address": "3901 Greenridge Dr",
        "price": 432000,
        "sqft": 2150,
        "pricePerSqft": 201,
        "daysOnMarket": 30
      },
      {
        "address": "3855 Greenridge Dr",
        "price": 449900,
        "sqft": 2300,
        "pricePerSqft": 196,
        "daysOnMarket": 60
      }
    ],
    "marketTrends": {
      "averagePrice": 442300,
      "averagePricePerSqft": 199,
      "averageDaysOnMarket": 45,
      "priceAppreciation": "4.2%",
      "rentGrowth": "5.1%"
    }
  }'::jsonb,
  true
);