import { notFound } from "next/navigation"
import { MOCK_BASKETS, VIEWERS } from "@/lib/data"
import { BasketReviewPage } from "@/components/basket-review-page"

interface ReviewPageProps {
  params: Promise<{ basketId: string; approverId: string }>
}

export async function generateMetadata({ params }: ReviewPageProps) {
  const { basketId } = await params
  const basket = MOCK_BASKETS.find((b) => b.id === basketId)
  return {
    title: basket ? `Review: ${basket.name} — Basket Manager` : "Basket Review",
  }
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { basketId, approverId } = await params

  const basket = MOCK_BASKETS.find((b) => b.id === basketId)
  const viewer = VIEWERS.find((v) => v.id === approverId)

  if (!basket || !viewer || viewer.role !== "approver") {
    notFound()
  }

  return <BasketReviewPage initialBasket={basket} viewer={viewer} />
}
