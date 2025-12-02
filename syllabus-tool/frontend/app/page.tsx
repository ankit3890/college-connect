import SearchBox from "./search/page"; // Reusing the search page logic or component
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/search");
}
