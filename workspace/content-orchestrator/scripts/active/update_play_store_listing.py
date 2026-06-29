#!/usr/bin/env python3
"""
Update Google Play Store listing for com.emartbd.app via Developer API.
Uses the service account at /root/.config/emart-play-service-account.json.
Run: python3 update_play_store_listing.py
"""

import json
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

PACKAGE_NAME = "com.emartbd.app"
SERVICE_KEY = "/root/.config/emart-play-service-account.json"
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]

LISTING_EN = {
    "title": "Emart Skincare Bangladesh",
    "shortDescription": "Authentic Korean & global beauty. COD available.",
    "fullDescription": """Emart Skincare Bangladesh is your trusted online beauty shopping app for authentic Korean, Japanese, and global skincare products in Bangladesh.

Shop popular skincare, sunscreen, cleansers, serums, moisturisers, masks, hair care, and beauty essentials — all with prices in BDT. Browse products, search by category, add items to your cart, and place orders from your phone.

WHY SHOP WITH EMART:
✓ Authentic Korean, Japanese, and global beauty products
✓ Cash on Delivery (COD) available across Bangladesh
✓ bKash and Nagad merchant payment support
✓ Fast delivery — Dhaka: 1–2 business days, nationwide: 3–5 business days
✓ Free shipping on orders over ৳3,000
✓ Product details, prices, images, ratings, and customer reviews
✓ English and Bangla app experience
✓ Customer support by phone, WhatsApp, and email
✓ 7-day return & exchange policy
✓ Secure checkout — your data is protected

POLICIES:
• Shipping Policy: https://e-mart.com.bd/shipping-policy
• Return & Refund Policy: https://e-mart.com.bd/return-policy
• Privacy Policy: https://e-mart.com.bd/privacy-policy
• Terms & Conditions: https://e-mart.com.bd/terms-conditions

Emart is operated by HG Corporation in Dhaka, Bangladesh. We focus on genuine products, practical skincare shopping, and local support for Bangladeshi customers.

Contact us: support@e-mart.com.bd | WhatsApp: +8801919797399""",
    "language": "en-US",
}

LISTING_BN = {
    "title": "Emart Skincare Bangladesh",
    "shortDescription": "অথেনটিক কোরিয়ান ও গ্লোবাল বিউটি। ক্যাশ অন ডেলিভারি।",
    "fullDescription": """Emart Skincare Bangladesh অ্যাপে পাওয়া যায় অথেনটিক কোরিয়ান, জাপানি ও গ্লোবাল স্কিনকেয়ার পণ্য — সরাসরি বাংলাদেশে ডেলিভারি।

স্কিনকেয়ার, সানস্ক্রিন, ক্লেনজার, সিরাম, ময়েশ্চারাইজার, মাস্ক, হেয়ার কেয়ার ও বিউটি পণ্য ব্রাউজ করুন, কার্টে যোগ করুন এবং মোবাইল থেকেই অর্ডার করুন।

কেন Emart বেছে নেবেন:
✓ অথেনটিক কোরিয়ান, জাপানি ও গ্লোবাল বিউটি পণ্য
✓ ক্যাশ অন ডেলিভারি — সারা বাংলাদেশে
✓ বিকাশ ও নগদ merchant payment সাপোর্ট
✓ দ্রুত ডেলিভারি — ঢাকা: ১–২ কার্যদিবস, সারা দেশ: ৩–৫ কার্যদিবস
✓ ৳৩,০০০+ অর্ডারে ফ্রি শিপিং
✓ পণ্যের ছবি, দাম, বিবরণ, রেটিং ও রিভিউ
✓ বাংলা ও ইংরেজি সাপোর্ট
✓ ফোন, WhatsApp ও ইমেইল কাস্টমার সাপোর্ট
✓ ৭ দিনের রিটার্ন ও এক্সচেঞ্জ পলিসি
✓ নিরাপদ চেকআউট — আপনার তথ্য সুরক্ষিত

নীতিমালা:
• শিপিং পলিসি: https://e-mart.com.bd/shipping-policy
• রিটার্ন পলিসি: https://e-mart.com.bd/return-policy
• প্রাইভেসি পলিসি: https://e-mart.com.bd/privacy-policy
• Terms & Conditions: https://e-mart.com.bd/terms-conditions

যোগাযোগ: support@e-mart.com.bd | WhatsApp: +8801919797399""",
    "language": "bn-BD",
}

CONTACT_INFO = {
    "email": "support@e-mart.com.bd",
    "phone": "+8801919797399",
    "website": "https://e-mart.com.bd",
}

PRIVACY_POLICY_URL = "https://e-mart.com.bd/privacy-policy"


def main():
    creds = service_account.Credentials.from_service_account_file(SERVICE_KEY, scopes=SCOPES)
    service = build("androidpublisher", "v3", credentials=creds, cache_discovery=False)
    edits = service.edits()

    print(f"Opening edit for {PACKAGE_NAME}...")
    edit = edits.insert(packageName=PACKAGE_NAME).execute()
    edit_id = edit["id"]
    print(f"Edit ID: {edit_id}")

    try:
        # English store listing
        print("Updating English store listing...")
        edits.listings().update(
            packageName=PACKAGE_NAME,
            editId=edit_id,
            language="en-US",
            body={
                "language": "en-US",
                "title": LISTING_EN["title"],
                "shortDescription": LISTING_EN["shortDescription"],
                "fullDescription": LISTING_EN["fullDescription"],
            },
        ).execute()
        print("  ✓ English listing updated")

        # Bengali store listing
        print("Updating Bengali store listing...")
        edits.listings().update(
            packageName=PACKAGE_NAME,
            editId=edit_id,
            language="bn-BD",
            body={
                "language": "bn-BD",
                "title": LISTING_BN["title"],
                "shortDescription": LISTING_BN["shortDescription"],
                "fullDescription": LISTING_BN["fullDescription"],
            },
        ).execute()
        print("  ✓ Bengali listing updated")

        # App details (contact info + privacy policy)
        print("Updating app details and privacy policy URL...")
        edits.details().update(
            packageName=PACKAGE_NAME,
            editId=edit_id,
            body={
                "contactEmail": CONTACT_INFO["email"],
                "contactPhone": CONTACT_INFO["phone"],
                "contactWebsite": CONTACT_INFO["website"],
                "defaultLanguage": "en-US",
            },
        ).execute()
        print("  ✓ Contact info updated")

        # Commit the edit
        print("Committing edit...")
        result = edits.commit(packageName=PACKAGE_NAME, editId=edit_id).execute()
        print(f"  ✓ Committed. Edit ID: {result.get('id')}")
        print("\nAll done! Store listing updated in Google Play Console.")

    except HttpError as e:
        try:
            err = json.loads(e.content)
            print(f"\nAPI error {e.status_code}: {err.get('error', {}).get('message', e)}")
        except Exception:
            print(f"\nAPI error: {e}")
        print(f"Deleting edit {edit_id}...")
        try:
            edits.delete(packageName=PACKAGE_NAME, editId=edit_id).execute()
        except Exception:
            pass
        sys.exit(1)


if __name__ == "__main__":
    main()
