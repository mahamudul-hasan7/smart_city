-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 26, 2026 at 08:18 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `smart_city`
--

-- --------------------------------------------------------

--
-- Table structure for table `citizen`
--

CREATE TABLE `citizen` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `nid` varchar(20) NOT NULL,
  `dob` date NOT NULL,
  `street` varchar(200) DEFAULT NULL,
  `area` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `citizen`
--

INSERT INTO `citizen` (`id`, `user_id`, `name`, `nid`, `dob`, `street`, `area`, `city`, `email`, `password`, `created_at`, `updated_at`) VALUES
(17, 2336, 'Rakib Mahamud', '432234', '2001-09-12', 'A Block', 'Sayed Nogor', 'Dhaka', 'rakibmahamud@gmail.com', '$2y$10$bx0uwQ64zgKRcP8nE8wt4eWBeC5sdlD4LSMb.f/g1f3XJ537xwpQC', '2026-01-26 14:14:57', '2026-01-26 15:04:13');

-- --------------------------------------------------------

--
-- Table structure for table `complaint`
--

CREATE TABLE `complaint` (
  `complaint_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `complaint`
--

INSERT INTO `complaint` (`complaint_id`, `user_id`, `title`, `description`, `category`, `location`, `status`, `created_date`) VALUES
(27, 2336, 'Road Problem', 'Road is broken about 95 days. We can not use this road properly', 'Road', 'Notun Bazar, A Block, Sayed Nogor', 'Resolved', '2026-01-26'),
(28, 2336, 'Road Nai', 'Ai khane kono paka road nai. Notun Rasta kore dao Emergency', 'Road', 'Notun Bazar, B Block, Sayed Nogor', 'Resolved', '2026-01-26'),
(29, 2336, 'Tree Planting', 'tree lagao poribesh bachao', 'Other', 'Gulshan–Banani Zone, Gulshan 2', 'In Progress', '2026-01-26'),
(30, 2336, 'Habijabi', 'dilam na kisu', 'Electricity', 'Dhanmondi Zone, Main road, near by school', 'pending', '2026-01-26');

-- --------------------------------------------------------

--
-- Table structure for table `complaint_status`
--

CREATE TABLE `complaint_status` (
  `status_id` int(11) NOT NULL,
  `complaint_id` int(11) NOT NULL,
  `status_name` varchar(50) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status_date` datetime DEFAULT current_timestamp(),
  `updated_by` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `complaint_status`
--

INSERT INTO `complaint_status` (`status_id`, `complaint_id`, `status_name`, `remarks`, `status_date`, `updated_by`) VALUES
(41, 27, 'In Progress', '', '2026-01-26 21:41:46', 'Staff ID: 0'),
(42, 27, 'Resolved', '', '2026-01-26 21:46:50', 'Staff ID: 0'),
(43, 28, 'Resolved', '', '2026-01-26 23:28:04', 'Staff ID: 0'),
(44, 29, 'In Progress', '', '2026-01-26 23:44:16', 'Staff ID: 0');

-- --------------------------------------------------------

--
-- Table structure for table `department`
--

CREATE TABLE `department` (
  `dept_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone_no` varchar(20) DEFAULT NULL,
  `office_street` varchar(100) DEFAULT NULL,
  `office_city` varchar(100) DEFAULT NULL,
  `office_area` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `department`
--

INSERT INTO `department` (`dept_id`, `name`, `email`, `phone_no`, `office_street`, `office_city`, `office_area`) VALUES
(1, 'Road', 'road@govt.bd', '01722225555', 'Main Road', 'Dhaka', 'Mirpur'),
(2, 'Roads & Transport Department', 'road.transport@smartcity.gov', '01784878475', 'Center Area', 'Dhaka', 'Mohakhali'),
(3, 'Water Supply & Sewerage', 'water.sewerage@smartcity.gov', '01354867991', 'Hospital Road', 'Dhaka', 'Rampura'),
(4, 'City Planning & Development', 'city.planning@smartcity.gov', '01758487875', 'Main Road', 'Dhaka', 'Uttora'),
(5, 'Public Safety & Emergency', 'public.safety@smartcity.gov', '01354789624', 'By Pass', 'Dhaka', 'Mohammadpur');

-- --------------------------------------------------------

--
-- Table structure for table `login_history`
--

CREATE TABLE `login_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `login_time` datetime DEFAULT current_timestamp(),
  `ip_address` varchar(64) DEFAULT NULL,
  `device_info` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login_history`
--

INSERT INTO `login_history` (`id`, `user_id`, `login_time`, `ip_address`, `device_info`) VALUES
(40, 2336, '2026-01-26 20:15:32', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'),
(41, 2336, '2026-01-26 20:15:38', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'),
(42, 2336, '2026-01-26 20:15:48', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'),
(43, 2336, '2026-01-26 23:11:58', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0');

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `phone_no` varchar(20) DEFAULT NULL,
  `zone_id` int(11) DEFAULT NULL,
  `dept_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`user_id`, `first_name`, `last_name`, `full_name`, `designation`, `email`, `joining_date`, `status`, `phone_no`, `zone_id`, `dept_id`) VALUES
(3, 'Nabila', 'Rahman', 'Nabila Rahman', 'Field Officer', 'nabila.rahman@smartcity.gov', '2026-01-26', 'Active', '01823456789', 6, 5),
(21, 'Karim', 'Mia', 'Karim Mia', 'Field Officer', 'karim@gmail.com', '2026-01-26', 'Active', '01354897156', 4, 2),
(206, 'Sadman', 'Hossain', 'Sadman Hossain', 'Field Officer', 'sadman.hossain@smartcity.gov', '2026-01-26', 'Active', '01767890123', 6, 4),
(202601, 'Arif', 'Hasan', 'Arif Hasan', 'Field Officer', 'arif.hasan@smartcity.gov', '2026-01-26', 'Active', '01712345678', 3, 3);

-- --------------------------------------------------------

--
-- Table structure for table `staffassignment`
--

CREATE TABLE `staffassignment` (
  `assignment_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `complaint_id` int(11) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `assigned_date` datetime DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'Assigned',
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `staffassignment`
--

INSERT INTO `staffassignment` (`assignment_id`, `staff_id`, `complaint_id`, `department_id`, `assigned_date`, `status`, `notes`) VALUES
(5, 21, 27, NULL, '2026-01-26 21:05:37', 'Assigned', 'Department assigned from dashboard'),
(6, 202601, 28, 3, '2026-01-26 21:59:38', 'Assigned', 'Assigned from Assign page'),
(10, 206, 29, 4, '2026-01-26 23:43:07', 'Assigned', 'Assigned from Assign page');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone_no` varchar(20) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `name`, `email`, `password`, `phone_no`, `role`, `status`, `last_login`, `created_at`) VALUES
(3, 'Nabila Rahman', 'nabila.rahman@smartcity.gov', '$2y$10$PwK.59oXTYe9uqbCQJT81e1Je797ypkaA2JdvF6i2xT7CTbHua02W', '01823456789', 'Staff', 'Active', NULL, '2026-01-26 23:30:47'),
(21, 'Karim Mia', 'karim@gmail.com', '$2y$10$sY6Dl24HZQZ50LVQjvKZtONkkSBQwEwb0CPM5s8Lg0s4UTwxS3gxC', '01354897156', 'Staff', 'Active', NULL, '2026-01-26 20:50:32'),
(206, 'Sadman Hossain', 'sadman.hossain@smartcity.gov', '$2y$10$Jbd0cVvZeaZOD6.X9DZPReh0InjiO1LRDeqkW0yNLcva/..sxoVf2', '01767890123', 'Staff', 'Active', NULL, '2026-01-26 23:31:48'),
(2326, 'System Admin', 'admin', '$2y$10$720ib1T5bOnqpVh0fl0fHu4utBN8NXsZHzOLRF4lT5rCiXFuB34.2', '', 'Admin', 'Active', NULL, '2026-01-25 06:11:48'),
(2336, 'Rakib Mahamud', 'rakibmahamud@gmail.com', '$2y$10$bx0uwQ64zgKRcP8nE8wt4eWBeC5sdlD4LSMb.f/g1f3XJ537xwpQC', '', 'Citizen', 'Active', '2026-01-26 23:11:58', '2026-01-26 20:14:57'),
(202601, 'Arif Hasan', 'arif.hasan@smartcity.gov', '$2y$10$pCZ/Dm087BT3Qc6SvDCceOSEqWCKxrQ4TeemkhXOnub2rNxFVjpZq', '01712345678', 'Staff', 'Active', NULL, '2026-01-26 22:55:49');

-- --------------------------------------------------------

--
-- Table structure for table `zone`
--

CREATE TABLE `zone` (
  `zone_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `city_name` varchar(100) DEFAULT NULL,
  `area_description` text DEFAULT NULL,
  PRIMARY KEY (`zone_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=8;

--
-- Dumping data for table `zone`
--

INSERT INTO `zone` (`zone_id`, `name`, `city_name`, `area_description`) VALUES
(3, 'Notun Bazar', 'Dhaka', 'Main Road'),
(4, 'Mirpur Zone', 'Dhaka', 'Covers Mirpur sectors 1–14, residential areas, schools, and nearby hospitals'),
(5, 'Dhanmondi Zone', 'Dhaka', 'Covers Uttara sectors 1–14, airport-adjacent zones, residential and commercial areas'),
(6, 'Gulshan–Banani Zone', 'Dhaka', 'Diplomatic and commercial areas including Gulshan, Banani, and Baridhara'),
(7, 'Mohammadpur Zone', 'Dhaka', 'Residential neighborhoods, local markets, and mixed-use areas');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `citizen`
--
ALTER TABLE `citizen`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nid` (`nid`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `complaint`
--
ALTER TABLE `complaint`
  ADD PRIMARY KEY (`complaint_id`),
  ADD KEY `fk_complaint_user` (`user_id`);

--
-- Indexes for table `complaint_status`
--
ALTER TABLE `complaint_status`
  ADD PRIMARY KEY (`status_id`),
  ADD KEY `idx_complaint` (`complaint_id`);

--
-- Indexes for table `department`
--
ALTER TABLE `department`
  ADD PRIMARY KEY (`dept_id`);

--
-- Indexes for table `login_history`
--
ALTER TABLE `login_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_login` (`user_id`,`login_time`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `zone_id` (`zone_id`),
  ADD KEY `fk_staff_department` (`dept_id`);

--
-- Indexes for table `staffassignment`
--
ALTER TABLE `staffassignment`
  ADD PRIMARY KEY (`assignment_id`),
  ADD UNIQUE KEY `unique_assignment` (`staff_id`,`complaint_id`),
  ADD KEY `idx_staff` (`staff_id`),
  ADD KEY `idx_complaint` (`complaint_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `zone`
--
ALTER TABLE `zone`
  ADD PRIMARY KEY (`zone_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `citizen`
--
ALTER TABLE `citizen`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `complaint`
--
ALTER TABLE `complaint`
  MODIFY `complaint_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `complaint_status`
--
ALTER TABLE `complaint_status`
  MODIFY `status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `login_history`
--
ALTER TABLE `login_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `staffassignment`
--
ALTER TABLE `staffassignment`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=202602;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `citizen`
--
ALTER TABLE `citizen`
  ADD CONSTRAINT `fk_citizen_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `complaint`
--
ALTER TABLE `complaint`
  ADD CONSTRAINT `fk_complaint_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `complaint_status`
--
ALTER TABLE `complaint_status`
  ADD CONSTRAINT `complaint_status_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaint` (`complaint_id`) ON DELETE CASCADE;

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `fk_staff_department` FOREIGN KEY (`dept_id`) REFERENCES `department` (`dept_id`),
  ADD CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `staff_ibfk_2` FOREIGN KEY (`zone_id`) REFERENCES `zone` (`zone_id`);

--
-- Constraints for table `staffassignment`
--
ALTER TABLE `staffassignment`
  ADD CONSTRAINT `staffassignment_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `staffassignment_ibfk_2` FOREIGN KEY (`complaint_id`) REFERENCES `complaint` (`complaint_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
