
from app.database import SessionLocal
from app.models import Product


PRODUCT_IMAGES = {
    "Classic Black T-Shirt":
        "/products/classic-black-t-shirt.jpg",

    "Slim Fit Blue Jeans":
        "/products/slim-fit-blue-jeans.jpg",

    "Classic White Sneakers":
        "/products/classic-white-sneakers.jpg",

    "Black Casual Jacket":
        "/products/black-casual-jacket.jpg",

    "Premium Grey Sweatshirt":
        "/products/premium-grey-sweatshirt.jpg",

    "Navy Blue Polo Shirt":
        "/products/navy-blue-polo-shirt.jpg",

    "Beige Chino Pants":
        "/products/beige-chino-pants.jpg",

    "Olive Green Cargo Pants":
        "/products/olive-green-cargo-pants.jpg",

    "Women's Black Dress":
        "/products/womens-black-dress.jpg",

    "Women's Denim Jacket":
        "/products/womens-denim-jacket.jpg",

    "Classic Black Cap":
        "/products/classic-black-cap.jpg",

    "Leather Casual Belt":
        "/products/leather-casual-belt.jpg",
}


def update_product_images():
    db = SessionLocal()
    updated_count = 0
    missing_products = []

    try:
        for product_name, image_url in PRODUCT_IMAGES.items():
            product = (
                db.query(Product)
                .filter(Product.name == product_name)
                .first()
            )

            if product is None:
                print(f"NOT FOUND: {product_name}")
                missing_products.append(product_name)
                continue

            product.image_url = image_url
            print(f"UPDATED: {product_name}")
            updated_count += 1

        db.commit()

        print("\n===================================")
        print("PRODUCT IMAGE UPDATE COMPLETED")
        print("===================================")
        print(f"Products updated: {updated_count}")

        if missing_products:
            print("\nProducts not found:")
            for product_name in missing_products:
                print(f"- {product_name}")

    except Exception as error:
        db.rollback()
        print(f"\nERROR: {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    update_product_images()
