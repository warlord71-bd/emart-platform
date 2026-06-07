<?php
/**
 * Custom order creation endpoint for the headless checkout.
 *
 * Auth: X-Emart-Secret header must match EMART_ORDER_SECRET.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function emart_order_endpoint_secret() {
	if ( defined( 'EMART_ORDER_SECRET' ) && EMART_ORDER_SECRET ) {
		return (string) EMART_ORDER_SECRET;
	}
	return (string) getenv( 'EMART_ORDER_SECRET' );
}

function emart_order_endpoint_authorize( WP_REST_Request $request ) {
	$expected = emart_order_endpoint_secret();
	$provided = (string) $request->get_header( 'X-Emart-Secret' );

	if ( $expected !== '' && $provided !== '' && hash_equals( $expected, $provided ) ) {
		return true;
	}

	return new WP_Error( 'emart_order_forbidden', 'Forbidden', array( 'status' => 403 ) );
}

function emart_order_endpoint_clean_address( $address ) {
	$address = is_array( $address ) ? $address : array();
	$allowed = array(
		'first_name',
		'last_name',
		'company',
		'address_1',
		'address_2',
		'city',
		'state',
		'postcode',
		'country',
		'email',
		'phone',
	);
	$clean = array();

	foreach ( $allowed as $key ) {
		if ( isset( $address[ $key ] ) ) {
			$clean[ $key ] = wc_clean( wp_unslash( $address[ $key ] ) );
		}
	}

	return $clean;
}

function emart_order_endpoint_format_order( WC_Order $order ) {
	$line_items = array();
	foreach ( $order->get_items( 'line_item' ) as $item ) {
		$product = $item->get_product();
		$line_items[] = array(
			'id'         => (int) $item->get_id(),
			'name'       => $item->get_name(),
			'product_id' => (int) $item->get_product_id(),
			'quantity'   => (int) $item->get_quantity(),
			'total'      => $item->get_total(),
			'image'      => $product && $product->get_image_id()
				? array( 'src' => wp_get_attachment_url( $product->get_image_id() ) )
				: null,
		);
	}

	$date_created = $order->get_date_created();

	return array(
		'id'                   => (int) $order->get_id(),
		'customer_id'          => (int) $order->get_customer_id(),
		'status'               => $order->get_status(),
		'total'                => $order->get_total(),
		'currency'             => $order->get_currency(),
		'payment_method'       => $order->get_payment_method(),
		'payment_method_title' => $order->get_payment_method_title(),
		'line_items'           => $line_items,
		'billing'              => $order->get_address( 'billing' ),
		'shipping'             => $order->get_address( 'shipping' ),
		'date_created'         => $date_created ? $date_created->date( DATE_ATOM ) : '',
		'date_modified'        => $order->get_date_modified() ? $order->get_date_modified()->date( DATE_ATOM ) : '',
	);
}

function emart_order_endpoint_idempotency_key( $data ) {
	if ( empty( $data['meta_data'] ) || ! is_array( $data['meta_data'] ) ) {
		return '';
	}

	foreach ( $data['meta_data'] as $meta ) {
		if ( ! is_array( $meta ) || ( $meta['key'] ?? '' ) !== '_idempotency_key' ) {
			continue;
		}

		return substr( wc_clean( (string) ( $meta['value'] ?? '' ) ), 0, 64 );
	}

	return '';
}

function emart_order_endpoint_find_existing( $idempotency_key ) {
	if ( $idempotency_key === '' ) {
		return null;
	}

	$orders = wc_get_orders( array(
		'limit'      => 1,
		'orderby'    => 'date',
		'order'      => 'DESC',
		'meta_key'   => '_idempotency_key',
		'meta_value' => $idempotency_key,
	) );

	return ! empty( $orders[0] ) && $orders[0] instanceof WC_Order ? $orders[0] : null;
}

function emart_handle_create_order( WP_REST_Request $request ) {
	if ( ! function_exists( 'wc_create_order' ) ) {
		return new WP_REST_Response( array( 'error' => 'WooCommerce unavailable' ), 503 );
	}

	$data = $request->get_json_params();
	if ( ! is_array( $data ) ) {
		return new WP_REST_Response( array( 'error' => 'Invalid JSON payload' ), 400 );
	}

	foreach ( array( 'line_items', 'billing', 'payment_method' ) as $field ) {
		if ( empty( $data[ $field ] ) ) {
			return new WP_REST_Response( array( 'error' => "Missing: $field" ), 400 );
		}
	}

	if ( ! is_array( $data['line_items'] ) ) {
		return new WP_REST_Response( array( 'error' => 'Invalid line_items' ), 400 );
	}

	$idempotency_key = emart_order_endpoint_idempotency_key( $data );
	$existing_order  = emart_order_endpoint_find_existing( $idempotency_key );
	if ( $existing_order ) {
		return new WP_REST_Response( emart_order_endpoint_format_order( $existing_order ), 200 );
	}

	$customer_id = isset( $data['customer_id'] ) ? absint( $data['customer_id'] ) : 0;
	if ( $customer_id <= 0 && ! empty( $data['billing']['email'] ) ) {
		$user = get_user_by( 'email', sanitize_email( wp_unslash( $data['billing']['email'] ) ) );
		if ( $user instanceof WP_User ) {
			$customer_id = (int) $user->ID;
		}
	}

	$order = wc_create_order( array(
		'status'      => 'pending',
		'customer_id' => $customer_id,
		'created_via' => 'emart-bff',
	) );

	if ( is_wp_error( $order ) ) {
		return new WP_REST_Response( array( 'error' => $order->get_error_message() ), 500 );
	}

	try {
		$order->set_currency( ! empty( $data['currency'] ) ? wc_clean( $data['currency'] ) : 'BDT' );
		$order->set_prices_include_tax( 'yes' === get_option( 'woocommerce_prices_include_tax' ) );

		foreach ( $data['line_items'] as $line ) {
			if ( ! is_array( $line ) ) {
				throw new Exception( 'Invalid line item' );
			}

			$product_id = isset( $line['product_id'] ) ? absint( $line['product_id'] ) : 0;
			$quantity   = isset( $line['quantity'] ) ? absint( $line['quantity'] ) : 0;
			$product    = $product_id ? wc_get_product( $product_id ) : false;

			if ( ! $product || $quantity < 1 ) {
				throw new Exception( 'Invalid product in line_items' );
			}

			$args = array();
			if ( ! empty( $line['variation'] ) && is_array( $line['variation'] ) ) {
				$args['variation'] = wc_clean( $line['variation'] );
			}

			$order->add_product( $product, $quantity, $args );
		}

		$order->set_address( emart_order_endpoint_clean_address( $data['billing'] ), 'billing' );
		if ( ! empty( $data['shipping'] ) ) {
			$order->set_address( emart_order_endpoint_clean_address( $data['shipping'] ), 'shipping' );
		}

		$order->set_payment_method( wc_clean( $data['payment_method'] ) );
		$order->set_payment_method_title(
			! empty( $data['payment_method_title'] )
				? wc_clean( $data['payment_method_title'] )
				: wc_clean( $data['payment_method'] )
		);

		if ( ! empty( $data['customer_note'] ) ) {
			$order->set_customer_note( wc_clean( $data['customer_note'] ) );
		}

		if ( ! empty( $data['meta_data'] ) && is_array( $data['meta_data'] ) ) {
			foreach ( $data['meta_data'] as $meta ) {
				if ( ! is_array( $meta ) || empty( $meta['key'] ) || ! array_key_exists( 'value', $meta ) ) {
					continue;
				}
				$order->update_meta_data( wc_clean( $meta['key'] ), wc_clean( $meta['value'] ) );
			}
		}

		if ( ! empty( $data['shipping_lines'] ) && is_array( $data['shipping_lines'] ) ) {
			foreach ( $data['shipping_lines'] as $line ) {
				if ( ! is_array( $line ) ) {
					continue;
				}

				$item = new WC_Order_Item_Shipping();
				if ( ! empty( $line['method_id'] ) ) {
					$item->set_method_id( wc_clean( $line['method_id'] ) );
				}
				$item->set_method_title( ! empty( $line['method_title'] ) ? wc_clean( $line['method_title'] ) : 'Shipping' );
				$item->set_total( isset( $line['total'] ) ? (float) $line['total'] : 0 );
				$order->add_item( $item );
			}
		}

		if ( ! empty( $data['coupon_lines'] ) && is_array( $data['coupon_lines'] ) ) {
			foreach ( $data['coupon_lines'] as $coupon_line ) {
				if ( ! is_array( $coupon_line ) || empty( $coupon_line['code'] ) ) {
					continue;
				}

				$result = $order->apply_coupon( wc_format_coupon_code( wc_clean( $coupon_line['code'] ) ) );
				if ( is_wp_error( $result ) ) {
					throw new Exception( $result->get_error_message() );
				}
			}
		}

		$order->calculate_totals();
		$order->save();

		do_action( 'woocommerce_checkout_order_created', $order );

		$status = ! empty( $data['status'] ) ? sanitize_key( $data['status'] ) : 'pending';
		if ( $status && $status !== $order->get_status() ) {
			$order->update_status( $status, '', false );
		}

		return new WP_REST_Response( emart_order_endpoint_format_order( $order ), 201 );
	} catch ( Exception $error ) {
		$order->delete( true );
		return new WP_REST_Response( array( 'error' => $error->getMessage() ), 400 );
	}
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'emart/v1', '/create-order', array(
		'methods'             => WP_REST_Server::CREATABLE,
		'callback'            => 'emart_handle_create_order',
		'permission_callback' => 'emart_order_endpoint_authorize',
	) );
} );
