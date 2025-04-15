#!/bin/bash
# Create a backup
cp server/routes.ts server/routes.ts.backup

# 1. Replace the first transformation block
sed -i '672,691c\      // 直接使用数据库返回的产品 - Drizzle ORM 已经将列名映射为正确的 camelCase\n      const products = productsFromDb;\n' server/routes.ts

# 2. Replace the second transformation block (products by category)
sed -i '715,734c\      // 直接使用数据库返回的产品 - Drizzle ORM 已经将列名映射为正确的 camelCase\n      const products = productsFromDb;\n' server/routes.ts

# 3. Replace the third transformation (product detail)
sed -i '762,776c\      // 直接使用数据库返回的产品 - Drizzle ORM 已经将列名映射为正确的 camelCase\n      const product = productFromDb;\n' server/routes.ts

# Make the script executable
chmod +x fix_routes.sh
