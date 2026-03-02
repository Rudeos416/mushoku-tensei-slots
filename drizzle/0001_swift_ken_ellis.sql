CREATE TABLE `coin_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('purchase','spin_debit','spin_win','bonus','admin_credit') NOT NULL,
	`amount` bigint NOT NULL,
	`balanceAfter` bigint NOT NULL,
	`referenceId` varchar(128),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coin_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`coins` int NOT NULL,
	`priceUsd` decimal(10,2) NOT NULL,
	`bonusCoins` int NOT NULL DEFAULT 0,
	`isPopular` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `credit_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jackpot` (
	`id` int AUTO_INCREMENT NOT NULL,
	`currentAmount` bigint NOT NULL DEFAULT 125000,
	`lastWonAt` timestamp,
	`lastWonBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jackpot_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`packageId` int NOT NULL,
	`paypalOrderId` varchar(128),
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`amountUsd` decimal(10,2) NOT NULL,
	`coinsToCredit` int NOT NULL,
	`creditedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`imageUrl` text,
	`pointsCost` int NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`category` varchar(64) NOT NULL DEFAULT 'merch',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `redemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`pointsSpent` int NOT NULL,
	`status` enum('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`shippingName` text,
	`shippingAddress` text,
	`shippingCity` text,
	`shippingCountry` varchar(64),
	`trackingNumber` varchar(128),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `redemptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spin_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`betCoins` int NOT NULL,
	`winCoins` int NOT NULL DEFAULT 0,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`reels` text NOT NULL,
	`isJackpot` boolean NOT NULL DEFAULT false,
	`isFreeSpins` boolean NOT NULL DEFAULT false,
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spin_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`coins` bigint NOT NULL DEFAULT 0,
	`points` bigint NOT NULL DEFAULT 0,
	`totalCoinsSpent` bigint NOT NULL DEFAULT 0,
	`totalPointsEarned` bigint NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallets_userId_unique` UNIQUE(`userId`)
);
