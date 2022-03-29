import { encrypt } from './encrypt'

/**
 * @type {{
 *  [key: string]: {select: string, type: 'text', id: number }
 *  | { select: string, type: 'attr', attr: string[], id: number }[]
 * }}
 */
const rules = {
	title: [
		{
			select: '#productTitle',
			type: 'text',
			id: 0,
		},
		{
			select: '#btAsinTitle',
			type: 'text',
			id: 1,
		},
		{
			select: '.feature_Title',
			type: 'text',
			id: 2,
		},
	],
	price: [
		{
			select: '#priceblock_ourprice',
			type: 'text',
			id: 0,
		},
		{
			select: '#priceblock_saleprice',
			type: 'text',
			id: 1,
		},
		{
			select: '#priceblock_dealprice',
			type: 'text',
			id: 2,
		},
		{
			select: '.qa-price-block-our-price',
			type: 'text',
			id: 3,
		},
		{
			select: '#olp_feature_div > div.a-section.a-spacing-small.a-spacing-top-small > span > a > span.a-size-base.a-color-price',
			type: 'text',
			id: 4,
		},
		{
			select: '#aod-price-1 > span > span.a-offscreen',
			type: 'text',
			id: 5,
		},
		{
			select: '#aod-price-1 > span > span:nth-child(2)',
			type: 'text',
			id: 6,
		},
		{
			select: '#price_inside_buybox',
			type: 'text',
			id: 7,
		},
		{
			select: '#corePrice_desktop > div > table > tbody > tr > td:eq(1) > span > span:eq(0) >span:eq(0)',
			type: 'text',
			id: 8,
		},
		{
			select: '#corePrice_desktop > div > table > tbody > tr > td:eq(1) > span > span:eq(0)',
			type: 'text',
			id: 9,
		},
		{
			select: '#corePrice_desktop > div > table > tbody > tr td:contains(Price) + * span.a-offscreen',
			type: 'text',
			id: 12,
		},
		{
			select: '#corePrice_feature_div span.a-offscreen',
			type: 'text',
			id: 13,
		},
		{
			select: '#buyNew_noncbb > span',
			type: 'text',
			id: 10,
		},
		{
			select: '#aod-offer-list #aod-offer:eq(0) #aod-offer-price >div>div>div>div#aod-price-1>span>span:eq(0)',
			type: 'text',
			id: 11,
		},
	],
	images: [
		{
			select: '#imgTagWrapperId img',
			type: 'attr',
			attr: ['data-old-hires', 'src'],
			id: 0,
		},
		{
			select: '#main-image-container img',
			type: 'attr',
			attr: ['src'],
			id: 1,
		},
		{
			select: '#masrw-main-image-inner img',
			type: 'attr',
			attr: ['src'],
			id: 2,
		},
		{
			select: '#mainImageContainer img',
			type: 'attr',
			attr: ['src'],
			id: 3,
		},
		{
			select: '#landingImage img',
			type: 'attr',
			attr: ['src'],
			id: 4,
		},
		{
			select: '#img-canvas img',
			type: 'attr',
			attr: ['src'],
			id: 5,
		},
		{
			select: '#ebooks-img-canvas img',
			type: 'attr',
			attr: ['src'],
			id: 6,
		},
		{
			select: '.mainImageCell img',
			type: 'attr',
			attr: ['src'],
			id: 7,
		},
		{
			select: '.qa-image-block-main-image img',
			type: 'attr',
			attr: ['src'],
			id: 8,
		},
	],
	brand: [
		{
			select: '#productOverview_feature_div td:contains(Brand) + *',
			type: 'text',
			id: 5,
		},
		{
			select: '#productOverview_feature_div th:contains(Brand) + *',
			type: 'text',
			id: 6,
		},
		{
			select: 'th:contains(Brand Name) + *',
			type: 'text',
			id: 0,
		},
		{
			select: 'th:contains(Brand) + *',
			type: 'text',
			id: 1,
		},
		{
			select: '#bylineInfo:contains(Marque)',
			type: 'text',
			id: 2,
		},
		{
			select: '#bylineInfo:contains(Brand)',
			type: 'text',
			id: 3,
		},
		{
			select: '#bylineInfo',
			type: 'text',
			id: 4,
		},
	],
	asin: [
		{
			select: '#ASIN',
			type: 'val',
			id: 0,
		},
		{
			select: 'th:contains(ASIN) + *',
			type: 'text',
			id: 1,
		},
		{
			select: 'li span:contains(ASIN)',
			type: 'text',
			id: 2,
		},
	],
	ratings: [
		{
			select: '#acrCustomerReviewText:eq(0)',
			type: 'text',
			id: 0,
		},
	],
	score: [
		{
			select: '#acrPopover:eq(0)',
			type: 'attr',
			attr: ['title'],
			id: 0,
		},
	],
	marketUrl: [
		{
			select: '#sellerProfileTriggerId',
			type: 'attr',
			attr: ['href'],
			id: 0,
		},
		{
			select: '#shipsFromSoldByInsideBuyBox_feature_div #merchant-info a:eq(0)',
			type: 'attr',
			attr: ['href'],
			id: 1,
		},
		{
			select: '#shipsFromSoldBy_feature_div #merchant-info a:eq(0)',
			type: 'attr',
			attr: ['href'],
			id: 2,
		},
		{
			select: '#aod-offer-soldBy > div > div > div a',
			type: 'attr',
			attr: ['href'],
			id: 3,
		},
		{
			select: '#merchant-info > a',
			type: 'attr',
			attr: ['href'],
			id: 4,
		},
	],
	rank: [
		{
			select: 'th:contains(Best Sellers Rank) + *',
			type: 'text',
			id: 0,
		},
		{
			select: '#detailBulletsWrapper_feature_div ul:contains(classifica) > li > span.a-list-item',
			type: 'text',
			id: 14,
		},
		{
			select: 'th:contains(los clientes) + *',
			type: 'text',
			id: 13,
		},
		{
			select: 'th:contains(Posizione nella classifica Bestseller di Amazon) + *',
			type: 'text',
			id: 1,
		},
		{
			select: 'li:contains(Best Sellers Rank)',
			type: 'text',
			id: 2,
		},
		{
			select: 'li:contains(Clasificación en los más vendidos de Amazon)',
			type: 'text',
			id: 3,
		},
		{
			select: 'th:contains(Amazon Bestseller-Rang) + *',
			type: 'text',
			id: 4,
		},
		{
			select: 'li:contains(Amazon Bestseller)',
			type: 'text',
			id: 5,
		},
		{
			select: 'th:contains(Amazon Bestseller) + *',
			type: 'text',
			id: 6,
		},
		{
			select: '#SalesRank',
			type: 'text',
			id: 7,
		},
		{
			select: '#productDetails_detailBullets_sections1 th:contains("Classement des meilleures")',
			type: 'text',
			id: 15,
		},
		{
			select: '#productDetails_detailBullets_sections1 th:contains("Ranking dos mais vendidos")',
			type: 'text',
			id: 16,
		},
		{
			select: '#productDetails_db_sections #productDetails_detailBullets_sections1',
			type: 'text',
			id: 8,
		},
		{
			select: '#productDetails_detailBullets_sections1 th:contains("Amazon") + *',
			type: 'text',
			id: 9,
		},
		{
			select: '#detailBullets #detailBulletsWrapper_feature_div >ul >li:eq(0)',
			type: 'text',
			id: 10,
		},
		{
			select: '#detailBulletsWrapper_feature_div > ul:contains(Ranking) .a-list-item',
			type: 'text',
			id: 11,
		},
		{
			select: '#detailBulletsWrapper_feature_div ul:contains(des meilleures ventes) > li > span.a-list-item',
			type: 'text',
			id: 12,
		},
	],
	is_fba: [
		{
			select: '#aod-offer-list #aod-offer:eq(0) #aod-offer-shipsFrom >div>div >div.a-fixed-left-grid-col a-col-right>span',
			type: 'text',
			id: 0,
		},
		{
			select: '#tabular-buybox>div.tabular-buybox-container',
			type: 'text',
			id: 1,
		},
		{
			select: '#tabular_feature_div > div > table > tbody > tr:nth-child(1) > td:nth-child(2) > span',
			type: 'text',
			id: 2,
		},
		{
			select: '#freshShipsFromSoldBy_feature_div > div > table > tbody > tr:nth-child(1) > td:nth-child(2) > span',
			type: 'text',
			id: 3,
		},
		{
			select: '#merchant-info',
			type: 'text',
			id: 4,
		},
		{
			select: ['#sellerProfileTriggerId', '#SSOFpopoverLink_ubb'],
			type: 'text',
			id: 5,
		},
		{
			select: '#sellerProfileTriggerId',
			type: 'text',
			id: 6,
		},
		{
			select: '#SSOFpopoverLink',
			type: 'text',
			id: 7,
		},
		{
			select: '#tabular-buybox-truncate-0',
			type: 'text',
			id: 8,
		},
		{
			select: '#aod-offer-shipsFrom > div > div > div.a-fixed-left-grid-col.a-col-right > span',
			type: 'text',
			id: 9,
		},
		{
			select: '.qa-ships-from-sold-by-text',
			type: 'text',
			id: 10,
		},
		{
			select: '#tabular-buybox-truncate-0 > span.a-truncate-cut > span',
			type: 'text',
			id: 11,
		},
	],
	shopping_cart_market: [
		{
			select: '#sellerProfileTriggerId',
			type: 'text',
			id: 0,
		},
		{
			select: '#merchant-info > a:nth-child(2)',
			type: 'text',
			id: 1,
		},
		{
			select: '#merchant-info',
			type: 'text',
			id: 2,
		},
		{
			select: '#aod-offer-soldBy > div > div > div.a-fixed-left-grid-col.a-col-right > a',
			type: 'text',
			id: 3,
		},
		{
			select: '#tabular-buybox-truncate-1',
			type: 'text',
			id: 4,
		},
		{
			select: '#tabular-buybox > div.tabular-buybox-container > div:nth-child(4) > div > span',
			type: 'text',
			id: 5,
		},
		{
			select: '#tabular_feature_div',
			type: 'text',
			id: 6,
		},
		{
			select: '.qa-ships-from-sold-by-text span:eq(1)',
			type: 'text',
			id: 7,
		},
	],
	country: [
		{
			select: '#seller-profile-container > div.a-spacing-medium > div > ul > li:last-child > span > ul > li:last-child > span',
			type: 'text',
			id: 0,
		},
		{
			select: '#seller-profile-container > div.a-row.a-spacing-medium > div > ul > li:eq(2) > span > ul > li:eq(5) > span',
			type: 'text',
			id: 1,
		},
		{
			select: '#seller-profile-container > div.a-row.a-spacing-medium > div > ul > li:eq(2) > span > ul > li:eq(4) > span',
			type: 'text',
			id: 2,
		},
		{
			select: '#seller-profile-container > div.a-row.a-spacing-medium > div > ul > li:nth-child(6) > span > ul > li:nth-child(5) > span',
			type: 'text',
			id: 3,
		},
		{
			select: '#seller-profile-container > div.a-row.a-spacing-medium > div > ul > li:nth-child(5) > span > ul > li:nth-child(6) > span',
			type: 'text',
			id: 4,
		},
		{
			select: '#seller-profile-container > div.a-row.a-spacing-medium > div > ul > li:nth-child(5) > span > ul > li:nth-child(5) > span',
			type: 'text',
			id: 5,
		},
		{
			select: '#seller-profile-container > div.a-row.a-spacing-medium > div > ul > li:nth-child(5) > span > ul > li:nth-child(6)',
			type: 'text',
			id: 6,
		},
		{
			select: '#seller-profile-container > div.a-row.a-spacing-medium > div > ul > li:nth-child(2) > span > ul > li:nth-child(6)',
			type: 'text',
			id: 7,
		},
		{
			select: '#seller-profile-container > div.a-row.a-spacing-medium > div > ul > li:nth-child(3) > span > ul > li:nth-child(6) > span',
			type: 'text',
			id: 8,
		},
	],
	seller_id: [
		{
			select: '#sellerProfileTriggerId',
			type: 'attr',
			attr: ['href'],
			id: 0,
		},
		{
			select: '#merchant-info',
			type: 'attr',
			attr: ['href'],
			id: 1,
		},
		{
			select: '#aod-offer-soldBy > div > div > div.a-fixed-left-grid-col.a-col-right > a',
			type: 'attr',
			attr: ['href'],
			id: 2,
		},
		{
			select: '#tabular-buybox-truncate-1',
			type: 'attr',
			attr: ['href'],
			id: 3,
		},
		{
			select: '.qa-ships-from-sold-by-text span:eq(1)',
			type: 'attr',
			attr: ['href'],
			id: 4,
		},
	],
	min_price: [
		{
			select: '#olpLinkWidget_feature_div > div.a-section.olp-link-widget > span > a > div > div > span.a-size-base.a-color-base',
			type: 'text',
			id: 0,
		},
		{
			select: '#size_name_0_price > span',
			type: 'text',
			id: 1,
		},
	],
	follow_count: [
		{
			select: '#olp_feature_div',
			type: 'text',
			id: 0,
		},
		{
			select: '#olpLinkWidget_feature_div > div.a-section.olp-link-widget > span > a > div > div > span:nth-child(1)',
			type: 'text',
			id: 1,
		},
		{
			select: '.olp-text-box > span:nth-child(1)',
			type: 'text',
			id: 2,
		},
	],
	delivery_fee: [
		{
			select: '#exports_desktop_qualifiedBuybox_tlc_feature_div',
			type: 'text',
			id: 0,
		},
		{
			select: '#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE',
			type: 'text',
			id: 1,
		},
		{
			select: '#mir-layout-DELIVERY_BLOCK-slot-DELIVERY_MESSAGE',
			type: 'text',
			id: 2,
		},
	],
	stock: [
		{
			select: ['#outOfStock', '.a-color-price.a-text-bold'],
			type: 'text',
			id: 0,
		},
		{
			select: '#outOfStock',
			type: 'text',
			id: 1,
		},
		{
			select: '#outOfStockBuyBox_feature_div',
			type: 'text',
			id: 2,
		},
		{
			select: '#availability',
			type: 'text',
			id: 3,
		},
		{
			select: '#availability_feature_div',
			type: 'text',
			id: 4,
		},
		{
			select: '#aod-offer-price',
			type: 'text',
			id: 5,
		},
	],
	// is_cn_seller: [
	// 	{
	// 		select: ''
	// 	}
	// ],
	first_available: [
		{
			select: 'th:contains(Date First Available) + *',
			type: 'text',
			id: 0,
		},
	],
}

export default rules

// console.log(111, encrypt(JSON.stringify(rules)))
