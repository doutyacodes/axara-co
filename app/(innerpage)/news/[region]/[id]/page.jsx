import GlobalApi from "@/app/api/_services/GlobalApi";
import NewPage from "./_component/NewPage";

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
    // Fetch the metadata for the news item
    const response = await GlobalApi.fetchOneNews({
      id: parseInt(id),
    });

    console.log(response.data);

    const { title, description, image_url } = response.data.newsData || {};

    // Provide fallback values for title, description, and image_url
    const imageUrl = image_url
      ? `https://wowfy.in/testusr/images/${image_url}`
      : "https://yourwebsite.com/default-image.jpg"; // Fallback image URL

    return {
      title: title || "News Details",
      description: description || "Explore the latest news.",
      openGraph: {
        title: title || "News Details",
        description: description || "Explore the latest news.",
        images: [imageUrl],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: title || "News Details",
        description: description || "Explore the latest news.",
        images: [imageUrl],
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
  return <NewPage />;
}
