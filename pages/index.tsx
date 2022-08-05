import type { NextPage } from "next";
import { gql } from "@apollo/client";
import { client } from "./_app";
import { useState } from "react";
import { Spinner } from "@chakra-ui/react";
import { IoMdLink } from "react-icons/io";

interface Mission {
  id: string;
  missionName: string;
  rocketName: string;
  description: string;
  website: string;
}

interface PropsType {
  data?: Mission[];
}

const Second: NextPage = (props: PropsType) => {
  const { data } = props;
  const [missions, setMissions] = useState<Mission[]>();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSearch = async (event: any) => {
    try {
      setProcessing(true);
      setMissions([]);
      const name = event.target.value;
      if (!name || name.length === 0) {
        setProcessing(false);
        return;
      }
      const search = data?.filter((item) =>
        item.missionName.toLowerCase().includes(name.toLowerCase())
      );
      setMissions(search);
      setProcessing(false);
    } catch (error) {
      console.log(error);
      setProcessing(false);
      setError("Error when fetching missions");
    }
  };

  const copyWebsite = (website: string) => {
    navigator.clipboard.writeText(website);
  };

  return (
    <div className="flex flex-col bg-gray-200 h-screen w-screen">
      <div className="mb-3 xl:w-96">
        <div className="input-group relative flex items-stretch w-full mb-4">
          <input
            type="search"
            className="form-control relative flex-auto min-w-0 block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-yellow-100 bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
            placeholder="Search"
            aria-label="Search"
            aria-describedby="button-addon2"
            onChange={handleSearch}
          />
        </div>
      </div>
      {processing && (
        <div className="flex flex-row items-center justify-center h-full w-full">
          <Spinner size="xl" />
        </div>
      )}
      {error && (
        <div className="flex flex-row items-center justify-center h-full w-full text-red-600">
          Error when searching mission!
        </div>
      )}
      {!processing && (
        <div className="flex flex-row items-start justify-start w-full h-full flex-wrap">
          {missions?.map((mission) => (
            <div
              key={mission.id}
              className="flex flex-col m-1 border border-blue-500 rounded-md w-64 h-72 shadow-lg"
            >
              <div className="bg-gray-200 h-1/2 rounded-md"></div>
              <div className="m-1 h-1/2 bg-white">
                <div className="flex flex-row m-1 justify-start items-center font-semibold">
                  {mission.missionName}
                  <button
                    data-tooltip-target="tooltip-default"
                    className="flex flex-row px-5 justify-around items-center font-semibold hover:text-gray-300"
                    onClick={() => copyWebsite(mission.website)}
                    title="Copy mission website!"
                  >
                    <IoMdLink />
                  </button>
                </div>
                <div className="flex m-1 flex-row text-sm text-gray-300">
                  {mission.rocketName}
                </div>
                <div className="flex m-1 flex-row text-xs text-gray-800 overflow-auto h-16 scrollbar-hide">
                  {mission.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// This gets called on every request
export async function getServerSideProps() {
  const searchMissionQuery = gql`
    query SearchMissions {
      missions {
        id
        description
        name
        website
      }
    }
  `;
  const { data } = await client.query({
    query: searchMissionQuery,
  });

  const searchLaunchQuery = gql`
    query SearchLaunch($mission_id: String) {
      launches(find: { mission_id: $mission_id }) {
        rocket {
          rocket_name
        }
      }
    }
  `;

  const result: Mission[] = [];
  for (const mission of data?.missions) {
    if (mission) {
      const { data: launchData } = await client.query({
        query: searchLaunchQuery,
        variables: {
          mission_id: mission.id,
        },
      });
      if (launchData) {
        const rocketName = launchData?.launches[0]?.rocket?.rocket_name;
        result.push({
          id: mission.id,
          missionName: mission.name,
          description: mission.description,
          website: mission.website,
          rocketName,
        });
      }
    }
  }
  return { props: { data: result } };
}

export default Second;
