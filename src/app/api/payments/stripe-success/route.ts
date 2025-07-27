import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment Intent ID required' }, { status: 400 })
    }

    const supabase = createClient()

    // Find the payment record with this Stripe payment intent
    const { data: payment, error: findError } = await (await supabase)
      .from('Payments')
      .select('*')
      .eq('stripe_intent_id', paymentIntentId)
      .single()

    if (findError || !payment) {
      console.log(`⚠️ Payment not found for Stripe intent: ${paymentIntentId}`)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Update payment status to completed
    const { data: updatedPayment, error: updateError } = await (await supabase)
      .from('Payments')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Failed to update payment status:', updateError)
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
    }

    console.log(`✅ Payment ${payment.id} marked as completed for Stripe intent ${paymentIntentId}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Payment status updated',
      payment: updatedPayment
    })

  } catch (error) {
    console.error('❌ Stripe success webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 