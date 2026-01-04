-- 为所有现有角色补发属性点
-- 如果角色的属性点为0，根据等级补发

UPDATE public.characters
SET available_attribute_points = level * 3
WHERE available_attribute_points = 0 OR available_attribute_points IS NULL;

-- 验证更新
SELECT 
  id,
  name,
  level,
  available_attribute_points,
  spirit_power,
  divine_sense,
  body_constitution,
  comprehension,
  fortune
FROM public.characters;
