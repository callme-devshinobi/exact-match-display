import { queryOptions } from "@tanstack/react-query";
import { getPromotionImage } from "./promotion.functions";

export const promotionImageQuery = queryOptions({
  queryKey: ["promotion-image"],
  queryFn: () => getPromotionImage(),
  staleTime: 50 * 60 * 1000,
});