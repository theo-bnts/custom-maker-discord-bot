SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE DATABASE IF NOT EXISTS `cmaker` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `cmaker`;

CREATE TABLE IF NOT EXISTS `config` (
  `list` int(11) NOT NULL AUTO_INCREMENT,
  `id` text NOT NULL,
  `data` text,
  PRIMARY KEY (`list`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `config` (`list`, `id`, `data`) VALUES
(1, 'fortnite_statut', '1234');

CREATE TABLE IF NOT EXISTS `guild_settings` (
  `list` int(11) NOT NULL AUTO_INCREMENT,
  `id` text,
  `add_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `available` tinyint(1) NOT NULL DEFAULT '1',
  `prefix` tinytext,
  `language` tinytext,
  `shop_channel` text,
  `news_channel` text,
  `third_party_news_channel` text,
  `verified_role` text,
  `rename_pseudo` tinyint(1) NOT NULL DEFAULT '0',
  `delete_commands` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`list`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `updates` (
  `primary_key` smallint(6) NOT NULL AUTO_INCREMENT,
  `type` tinytext NOT NULL,
  `subtype` tinytext,
  `gamemode` tinytext NOT NULL,
  `language` tinytext NOT NULL,
  `date` text,
  `data` longtext,
  PRIMARY KEY (`primary_key`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

INSERT INTO `updates` (`primary_key`, `type`, `subtype`, `gamemode`, `language`, `date`, `data`) VALUES
(1, 'fortnite_digits', NULL, 'br', 'all', NULL, NULL),
(2, 'shop', NULL, 'br', 'ar', '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z'),
(3, 'shop', NULL, 'br', 'de', '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z'),
(4, 'shop', NULL, 'br', 'en', '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z'),
(5, 'shop', NULL, 'br', 'es', '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z'),
(6, 'shop', NULL, 'br', 'es-419', '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z'),
(7, 'shop', NULL, 'br', 'fr', '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z'),
(8, 'shop', NULL, 'br', 'it', '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z'),
(9, 'shop', NULL, 'br', 'ja', NULL, NULL),
(10, 'shop', NULL, 'br', 'ko', NULL, NULL),
(11, 'shop', NULL, 'br', 'pl', '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z'),
(12, 'shop', NULL, 'br', 'pt-br', '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z'),
(13, 'shop', NULL, 'br', 'ru', '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z'),
(14, 'shop', NULL, 'br', 'tr', '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z'),
(16, 'shop', NULL, 'br', 'zh-cn', NULL, NULL),
(17, 'news', NULL, 'br', 'ar', '1970-01-01T00:00:00.000Z', '{\"sorted\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"],\"current\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"]}'),
(18, 'news', NULL, 'br', 'de', '1970-01-01T00:00:00.000Z', '{\"sorted\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"],\"current\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"]}'),
(19, 'news', NULL, 'br', 'en', '1970-01-01T00:00:00.000Z', '{\"sorted\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\",\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"],\"current\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"]}{\"sorted\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"],\"current\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"]}'),
(20, 'news', NULL, 'br', 'es', '1970-01-01T00:00:00.000Z', '{\"sorted\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"],\"current\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"]}'),
(21, 'news', NULL, 'br', 'es-419', '1970-01-01T00:00:00.000Z', '{\"sorted\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"],\"current\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"]}'),
(22, 'news', NULL, 'br', 'fr', '1970-01-01T00:00:00.000Z', '{\"sorted\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"],\"current\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"]}'),
(23, 'news', NULL, 'br', 'it', '1970-01-01T00:00:00.000Z', '{\"sorted\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"],\"current\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"]}'),
(24, 'news', NULL, 'br', 'ja', NULL, NULL),
(25, 'news', NULL, 'br', 'ko', NULL, NULL),
(26, 'news', NULL, 'br', 'pl', '1970-01-01T00:00:00.000Z', '{\"sorted\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"],\"current\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"]}'),
(27, 'news', NULL, 'br', 'pt-br', '1970-01-01T00:00:00.000Z', '{\"sorted\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"],\"current\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"]}'),
(28, 'news', NULL, 'br', 'ru', '1970-01-01T00:00:00.000Z', '{\"sorted\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"],\"current\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"]}'),
(29, 'news', NULL, 'br', 'tr', '1970-01-01T00:00:00.000Z', '{\"sorted\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"],\"current\":[\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\"]}'),
(30, 'news', NULL, 'br', 'zh-cn', NULL, NULL),
(32, 'rotation', 'next', 'br', 'ar', '1970-01-01T00:00:00.000Z', '[]'),
(31, 'rotation', 'next', 'br', 'en', '1970-01-01T00:00:00.000Z', '[]'),
(33, 'rotation', 'next', 'br', 'de', '1970-01-01T00:00:00.000Z', '[]'),
(34, 'rotation', 'next', 'br', 'es', '1970-01-01T00:00:00.000Z', '[]'),
(35, 'rotation', 'next', 'br', 'es-419', '1970-01-01T00:00:00.000Z', '[]'),
(36, 'rotation', 'next', 'br', 'fr', '1970-01-01T00:00:00.000Z', '[]'),
(37, 'rotation', 'next', 'br', 'it', '1970-01-01T00:00:00.000Z', '[]'),
(38, 'rotation', 'next', 'br', 'ja', NULL, NULL),
(39, 'rotation', 'next', 'br', 'ko', NULL, NULL),
(40, 'rotation', 'next', 'br', 'pl', '1970-01-01T00:00:00.000Z', '[]'),
(41, 'rotation', 'next', 'br', 'pt-br', '1970-01-01T00:00:00.000Z', '[]'),
(42, 'rotation', 'next', 'br', 'ru', '1970-01-01T00:00:00.000Z', '[]'),
(43, 'rotation', 'next', 'br', 'tr', '1970-01-01T00:00:00.000Z', '[]'),
(44, 'rotation', 'next', 'br', 'zh-cn', NULL, NULL);

CREATE TABLE IF NOT EXISTS `users` (
  `list` int(11) NOT NULL AUTO_INCREMENT,
  `id_discord` text NOT NULL,
  `id_epic` text,
  `last_verification_guild` text,
  `verification_date` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`list`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
