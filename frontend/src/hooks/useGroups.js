import { useQuery } from "@tanstack/react-query";
import { useApi } from "../utils/api";

export const useGroups = () => {
  const { makeRequest } = useApi();

  return useQuery({
    queryKey: ["groups"],
    queryFn: () => makeRequest("groups"),
    staleTime: 1000 * 60 * 5,
  });
};
