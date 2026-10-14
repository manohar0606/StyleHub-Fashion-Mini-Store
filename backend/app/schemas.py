from pydantic import BaseModel, ConfigDict, EmailStr, Field


# -----------------------------
# User Schemas
# -----------------------------

class UserRegister(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100
    )
    email: EmailStr
    password: str = Field(
        ...,
        min_length=8,
        max_length=72
    )


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


# -----------------------------
# Product Schemas
# -----------------------------

class ProductCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=150
    )
    description: str | None = None
    price: float = Field(
        ...,
        gt=0
    )
    image_url: str | None = None
    category: str = Field(
        ...,
        min_length=2,
        max_length=100
    )


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str | None
    price: float
    image_url: str | None
    category: str

    model_config = ConfigDict(from_attributes=True)


# -----------------------------
# Cart Schemas
# -----------------------------

class CartItemCreate(BaseModel):
    product_id: int = Field(
        ...,
        gt=0
    )
    quantity: int = Field(
        default=1,
        ge=1
    )


class CartItemUpdate(BaseModel):
    quantity: int = Field(
        ...,
        ge=1
    )


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductResponse

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    total_price: float


# -----------------------------
# Order Schemas
# -----------------------------

class OrderResponse(BaseModel):
    id: int
    total_amount: float
    status: str
    payment_status: str
    stripe_payment_intent_id: str | None

    model_config = ConfigDict(from_attributes=True)