<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Owner
        User::create([
            'id' => Str::uuid(),
            'name' => 'Owner Jamur',
            'email' => 'owner@jamur.com',
            'password' => bcrypt('password'),
            'role' => 'owner',
        ]);

        // Create Cashier
        User::create([
            'id' => Str::uuid(),
            'name' => 'Kasir Jamur',
            'email' => 'kasir@jamur.com',
            'password' => bcrypt('password'),
            'role' => 'cashier',
        ]);

        // Create Categories
        $categories = [
            ['name' => 'Crispy', 'is_active' => true],
            ['name' => 'Balado', 'is_active' => true],
            ['name' => 'Keripik', 'is_active' => true],
            ['name' => 'Sambal', 'is_active' => true],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }

        // Create Sample Products
        $products = [
            [
                'categories_id' => 1,
                'name' => 'Jamur Crispy Original',
                'description' => 'Jamur crispy rasa original yang renyah dan gurih',
                'price' => 25000,
                'image_url' => 'products/sample.jpg',
                'is_active' => true,
            ],
            [
                'categories_id' => 1,
                'name' => 'Jamur Crispy Pedas',
                'description' => 'Jamur crispy dengan rasa pedas yang menggugah selera',
                'price' => 27000,
                'image_url' => 'products/sample.jpg',
                'is_active' => true,
            ],
            [
                'categories_id' => 2,
                'name' => 'Jamur Balado',
                'description' => 'Jamur dengan bumbu balado khas Padang',
                'price' => 30000,
                'image_url' => 'products/sample.jpg',
                'is_active' => true,
            ],
            [
                'categories_id' => 3,
                'name' => 'Keripik Jamur',
                'description' => 'Keripik jamur tipis dan renyah',
                'price' => 20000,
                'image_url' => 'products/sample.jpg',
                'is_active' => true,
            ],
            [
                'categories_id' => 4,
                'name' => 'Sambal Jamur',
                'description' => 'Sambal dengan campuran jamur cincang',
                'price' => 35000,
                'image_url' => 'products/sample.jpg',
                'is_active' => true,
            ],
        ];

        foreach ($products as $product) {
            Product::create([
                'id' => Str::uuid(),
                ...$product,
            ]);
        }
    }
}
