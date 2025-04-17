
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `filepath` varchar(255) NOT NULL,
  `mimetype` varchar(100) NOT NULL,
  `size` int NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `caption` text,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `media_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `thumbnail_alt` varchar(255) DEFAULT '',
  `content` text NOT NULL,
  `user_id` int NOT NULL,
  `category_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stock_assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_assets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `symbol` varchar(10) NOT NULL,
  `date` date NOT NULL,
  `tts` decimal(20,2) DEFAULT NULL,
  `vcsh` decimal(20,2) DEFAULT NULL,
  `tb_tts_nganh` decimal(20,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_symbol_date` (`symbol`,`date`),
  KEY `idx_stock_assets_symbol_date` (`symbol`,`date`),
  CONSTRAINT `stock_assets_ibfk_1` FOREIGN KEY (`symbol`) REFERENCES `stock_info` (`symbol`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stock_daily`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_daily` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `symbol` varchar(10) NOT NULL,
  `trade_date` date DEFAULT NULL,
  `volume` bigint DEFAULT NULL,
  `close_price` decimal(10,2) NOT NULL,
  `return_value` decimal(10,6) DEFAULT NULL,
  `kldd` bigint DEFAULT NULL,
  `von_hoa` decimal(20,2) DEFAULT NULL,
  `pe` decimal(10,6) DEFAULT NULL,
  `roa` decimal(10,6) DEFAULT NULL,
  `roe` decimal(10,6) DEFAULT NULL,
  `eps` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_symbol_date` (`symbol`),
  KEY `idx_stock_daily_symbol_date` (`symbol`),
  CONSTRAINT `stock_daily_ibfk_1` FOREIGN KEY (`symbol`) REFERENCES `stock_info` (`symbol`)
) ENGINE=InnoDB AUTO_INCREMENT=1317 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stock_eps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_eps` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `symbol` varchar(10) NOT NULL,
  `date` date NOT NULL,
  `eps` decimal(10,2) DEFAULT NULL,
  `eps_nganh` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_symbol_date` (`symbol`,`date`),
  KEY `idx_stock_eps_symbol_date` (`symbol`,`date`),
  CONSTRAINT `stock_eps_ibfk_1` FOREIGN KEY (`symbol`) REFERENCES `stock_info` (`symbol`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stock_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `symbol` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `exchange` varchar(20) DEFAULT NULL,
  `industry` varchar(50) DEFAULT NULL,
  `website` varchar(100) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `symbol` (`symbol`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stock_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_metrics` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `symbol` varchar(10) NOT NULL,
  `date` date NOT NULL,
  `roa` decimal(10,6) DEFAULT NULL,
  `roe` decimal(10,6) DEFAULT NULL,
  `tb_roa_nganh` decimal(10,6) DEFAULT NULL,
  `tb_roe_nganh` decimal(10,6) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_symbol_date` (`symbol`,`date`),
  KEY `idx_stock_metrics_symbol_date` (`symbol`,`date`),
  CONSTRAINT `stock_metrics_ibfk_1` FOREIGN KEY (`symbol`) REFERENCES `stock_info` (`symbol`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stock_pe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_pe` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `symbol` varchar(10) NOT NULL,
  `date` date NOT NULL,
  `pe` decimal(10,6) DEFAULT NULL,
  `pe_nganh` decimal(10,6) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_symbol_date` (`symbol`,`date`),
  KEY `idx_stock_pe_symbol_date` (`symbol`,`date`),
  CONSTRAINT `stock_pe_ibfk_1` FOREIGN KEY (`symbol`) REFERENCES `stock_info` (`symbol`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `symbol` varchar(10) NOT NULL,
  `date` date NOT NULL,
  `open` decimal(10,2) DEFAULT NULL,
  `high` decimal(10,2) DEFAULT NULL,
  `low` decimal(10,2) DEFAULT NULL,
  `close` decimal(10,2) DEFAULT NULL,
  `band_dow` decimal(10,2) DEFAULT NULL,
  `band_up` decimal(10,2) DEFAULT NULL,
  `trend_q` decimal(10,2) DEFAULT NULL,
  `fq` decimal(10,2) DEFAULT NULL,
  `qv1` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_symbol_date` (`symbol`,`date`),
  KEY `idx_stocks_symbol_date` (`symbol`,`date`),
  CONSTRAINT `stocks_ibfk_1` FOREIGN KEY (`symbol`) REFERENCES `stock_info` (`symbol`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3602 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

