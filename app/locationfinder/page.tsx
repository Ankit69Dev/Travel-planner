// "use client";

// import { useState } from "react";
// import EXIF from "exif-js";

// const HF_TOKEN = "NEXT_PUBLIC_HF_TOKEN";

// export default function LocationFinder() {
//   const [result, setResult] = useState("");
  
//   const handleImage = (file: File) => {
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       const img = reader.result as string;
//       extractEXIF(file, img);
//     };
//     reader.readAsDataURL(file);
//   };

//   const extractEXIF = (file: File, dataUrl: string) => {
//     EXIF.getData(file, function () {
//       const lat = EXIF.getTag(this, "GPSLatitude");
//       const lon = EXIF.getTag(this, "GPSLongitude");
//       if (lat && lon) reverseGeocode(lat, lon);
//       else analyzeWithHugging(dataUrl);
//     });
//   };

//   const reverseGeocode = async (lat: any, lon: any) => {
//     try {
//       const res = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
//       );
//       const data = await res.json();
//       setResult("GPS Location: " + data.display_name);
//     } catch {
//       setResult("Failed to reverse geocode.");
//     }
//   };

//   const analyzeWithHugging = async (img: string) => {
//     try {
//       const res = await fetch(
//         "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${HF_TOKEN}`,
//           },
//           body: JSON.stringify({ inputs: img }),
//         }
//       );
//       const data = await res.json();
//       setResult("Hugging tags: " + JSON.stringify(data));
//     } catch (err) {
//       setResult("HF API error");
//     }
//   };

//   return (
//     <div>
//       <input type="file" onChange={(e) => e.target.files && handleImage(e.target.files[0])} />
//       <p>{result}</p>
//     </div>
//   );
// }
