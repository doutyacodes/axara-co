import GlobalApi from "@/app/api/_services/GlobalApi";
import NewPage2 from "./_component/NewPage2";

export async function generateMetadata({ params }) {
  // Destructure the 'id' from params
  const { id } = await params;

  console.log("ID:", id);

  // Check if ID exists and is valid
  if (!id || isNaN(id)) {
    console.error("Invalid or missing ID");
    return {
      title: "News Details",
      description: "Explore the latest news.",
    };
  }

  try {
    // Fetch the metadata for the news item using GlobalApi
    const response = await GlobalApi.fetchOneNews2({ id: parseInt(id) });
    console.log(response.data);

    const { title, description, image_url } = response.data.newsData || {};

    // If no valid data is returned, fall back to defaults
    return {
      title: title || "News Details",
      description: description || "Explore the latest news.",
      openGraph: {
        title: title || "News Details",
        description: description || "Explore the latest news.",
        images: image_url
          ? [`https://wowfy.in/testusr/images/${image_url}`]
          : [],
        type: "article",
        locale: "en_US",  // Optional: specify the locale
        site_name: "Your Website", // Optional: specify your website name
      },
      twitter: {
        card: "summary_large_image",
        title: title || "News Details",
        description: description || "Explore the latest news.",
        images: image_url
          ? [`https://wowfy.in/testusr/images/${image_url}`]
          : [],
      },
    };
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return {
      title: "News Details",
      description: "Explore the latest news.",
    };
  }
}

export default function NewsSection() {
  return <NewPage2 />;
}
