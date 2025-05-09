# Welcome to your SeeFood 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app (if you are using a physical device)

   ```bash
    npx expo start
   ```

   If that doesn't work, try:

   ```bash
   npx expo start --tunnel
   ```

Then open the Expo Go app on your phone and scan the QR code in the terminal.

If you are using an emulator, you can follow the instructions in [this Expo documentation](https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=simulated)

3. Log in to the app

Use the following credentials to log in to the app:

- **Email**: `TestingT@gmail.com`
- **Password**: `Password_123`

---

## How the app works

### Screens

All the screens are located in the `app/` directory. The screens inside `app/(tabs)/` (`Product.tsx`, `Scan.tsx`, `User.tsx`) are the screens navigatable by the bottom tab navigator. Other screens are navigatable by the stack navigator.

### Scanning & Search Product by SKU

Our app utilizes the [built-in Expo camera](https://docs.expo.dev/versions/latest/sdk/camera/) functionality of Expo to scan barcodes. The scanning screen is located in `app/(tabs)/Scan.tsx`. The scanned barcode is then used to fetch product information from the database.

The search by SKU functionality is basically the same as the scanning functionality, only that the user inputs the SKU manually.

### Data

The user data are stored in Firebase, and are accessed by using `services/FirebaseConfig.ts`.

The data about food products, ingredients and allergens are stored in AWS RDS. Data is accessed by
using service from `services/ProductService.ts`, then

The product pictures are currently locally stored in the `assets/product-images/` directory.

### Alternative Product Recommendation

See `fetchRecommendations` function in `services/ProductService.ts`.
When a product is unsafe to the user, the app will (1) fetch all products, (2) filter out the currently shown product, (3) only keep the products that contain at least one of the keywords in the currently shown product, (4) filter out the products that are unsafe to user.
