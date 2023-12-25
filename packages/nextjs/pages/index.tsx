import { NextPage } from "next";
import CreateMultisigForm from "~~/components/CreateMultisigForm";
import { MetaHeader } from "~~/components/MetaHeader";
import { addFirestoreDocument, fetchFirestoreCollection } from "~~/services/firebaseService";

interface TestData {
  id: string;
  title: string;
  content: string;
}

interface HomeProps {
  data: TestData[];
}

export const getServerSideProps = async () => {
  try {
    const data = await fetchFirestoreCollection("testData", "test");
    return { props: { data } };
  } catch (error) {
    if (error instanceof Error) {
      return { props: { data: [], error: error.message } };
    } else {
      return { props: { data: [], error: "An unexpected error occurred" } };
    }
  }
};

const Home: NextPage<HomeProps> = ({ data }) => {
  const handleWriteToDB = async () => {
    try {
      const testData = {
        title: "Test Write",
        content: "This is a test write to the database.",
      };
      const docId = await addFirestoreDocument("testData", testData);
      console.log(`Data written to testData with ID: ${docId}`);
    } catch (error) {
      console.error("Failed to write data:", error);
    }
  };
  return (
    <>
      <MetaHeader />
      <CreateMultisigForm />
    </>
  );
};

export default Home;
