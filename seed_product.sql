-- Update the existing product based on SLUG (which is unique)
INSERT INTO products (name, slug, model_url, config, is_active)
VALUES (
  'Basic T-Shirt',
  'basic-tshirt',
  '/t-shirt.glb',
  '{
    "modelScale": 0.5,
    "position": [0, -0.2, 0],
    "printableArea": {
      "x": 0,
      "y": 0.1,
      "scale": 0.3
    }
  }'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  model_url = EXCLUDED.model_url,
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active;
