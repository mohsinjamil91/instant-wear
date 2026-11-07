# InstantWear: Vercel par live karne ke steps

Website **Vercel** par chalegi. Database aur owner ka login **Firebase** se chalega (free plan se shuru kar sakte ho).

## Step 1: Firebase project banao (database + login)
1. console.firebase.google.com par jao, "Add project" dabao, naam do (jaise instantwear).
2. Project ke andar "Web" (`</>`) icon dabao, app ka naam do, "Register app".
3. Jo `firebaseConfig` dikhe, uski values `public/config.js` mein `PASTE_...` ki jagah daal do.

## Step 2: Owner ka asli login
1. **Build > Authentication > Get started**, phir **Email/Password** enable karo.
2. **Users** tab mein "Add user": apna email aur mazboot password do.
3. Us user ka **User UID** copy karo.
4. UID ko **do jagah** paste karo: `public/config.js` (ownerUid) aur `firestore.rules` (PASTE_OWNER_UID).

## Step 3: Database (Firestore)
1. **Build > Firestore Database > Create database**. Location `asia-south1 (Mumbai)`, mode **production**.
2. **Rules** tab kholo, wahan ka saara text hata do, `firestore.rules` file ka poora text paste karo (UID wali line badli hui honi chahiye), phir **Publish** dabao.

## Step 4: Vercel par deploy karo
**Tareeka A (aasan, GitHub se):**
1. Is folder ko ek GitHub repository mein upload karo.
2. vercel.com par signup/login karo, **Add New > Project** dabao, apni repository chuno.
3. Settings jaise hain waise rehne do (`vercel.json` sab bata deta hai) aur **Deploy** dabao.
4. Aapko `https://aapka-naam.vercel.app` jaisa link milega.

**Tareeka B (terminal se):**
```
npm install -g vercel
vercel login
vercel --prod
```
(Is folder ke andar chalao jahan `vercel.json` hai.)

## Step 5: Firebase ko Vercel ka address batao
Firebase console > **Authentication > Settings > Authorized domains > Add domain**.
Apna Vercel link (`aapka-naam.vercel.app`) aur baad mein apna domain bhi yahan add karo. Iske bina owner login nahi chalega.

## Step 6: Pehli baar owner panel kholo
1. Website ke link ke end mein `#owner` lagao: `https://aapka-naam.vercel.app/#owner`
2. Email aur password se sign in karo.
3. Khaali ho to "Load sample clothes" dabao, ya apne kapde add karo.
4. Ab jo badlenge wo turant sab customers ko dikhega, aur naye orders yahin aayenge.

## Step 7: Apna domain (jaise instantwear.in)
1. Domain khareedo (GoDaddy, Namecheap, Hostinger ya koi bhi registrar).
2. Vercel mein project kholo: **Settings > Domains > Add**, apna domain daalo.
3. Vercel jo DNS records dikhaye, unhe registrar ke DNS settings mein daal do.
4. Kuch ghante (kabhi ek din) mein chalne lagta hai, HTTPS apne aap lag jaata hai.
5. Step 5 wali Authorized domains list mein apna naya domain bhi add karna na bhoolna.

## Dhyan rakhne wali baatein
- `apiKey` secret nahi hai, wo website mein dikhti hi hai. Asli suraksha `firestore.rules` se aati hai.
- Customer ke order ki keemat browser se aati hai, to order aate hi owner panel mein items aur total dekh lena. Pakki suraksha ke liye baad mein server-side check lagana padega.
- Stock tab ghatta hai jab aap order ko "Packed" ya aage ka status dete ho. "Cancelled" karne par wapas jud jaata hai.
- Payment abhi cash ya UPI rider ko hai. Online payment (Razorpay) alag se jodna padega.
- Vercel aur Firebase ke free plan ki limits aur sharten unki site par check kar lena.
- Customers ke phone number aur address orders mein save hote hain, unhe sambhal ke rakhna.
