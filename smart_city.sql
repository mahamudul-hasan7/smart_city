-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 16, 2026 at 03:11 PM
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
  `gender` varchar(20) DEFAULT NULL,
  `street` varchar(200) DEFAULT NULL,
  `area` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `citizen`
--

INSERT INTO `citizen` (`id`, `user_id`, `name`, `nid`, `dob`, `gender`, `street`, `area`, `city`, `email`, `password`, `created_at`) VALUES
(17, 2336, 'Rakib Mahamud', '432234', '2001-09-12', 'male', 'A Block', 'Sayed Nogor', 'Dhaka', 'rakibmahamud@gmail.com', '$2y$10$bx0uwQ64zgKRcP8nE8wt4eWBeC5sdlD4LSMb.f/g1f3XJ537xwpQC', '2026-01-26 14:14:57'),
(18, 202602, 'Sabbir Hossein', '23455432', '2000-12-12', NULL, '', '', '', 'sabbirhossein@gmail.com', '$2y$10$0MWCEXo6.zPIgcZllobHs.hWKhD1YQ8RGFMVyHXJAef9.X2BenSgu', '2026-01-26 19:21:42'),
(19, 202603, 'monali islam', '852365', '2003-02-05', NULL, NULL, NULL, NULL, 'monali@gmail.com', '$2y$10$0K2KqKneScyZd8Vg29RNUePHiDmEVCBKWFc0r9g9pxWY4fe8L9v5a', '2026-01-27 05:34:20');

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
(28, 2336, 'Road Nai', 'Ai khane kono paka road nai. Notun Rasta kore dao Emergency', 'Road', 'Notun Bazar, B Block, Sayed Nogor', 'Resolved', '2026-01-26'),
(29, 2336, 'Tree Planting', 'tree lagao poribesh bachao', 'Other', 'Gulshan–Banani Zone, Gulshan 2', 'In Progress', '2026-01-26'),
(30, 2336, 'Habijabi', 'dilam na kisu', 'Electricity', 'Dhanmondi Zone, Main road, near by school', 'Rejected', '2026-01-26'),
(31, 202602, 'Water Problem', '2 din dhore line a pani nai', 'Water', 'Mirpur Zone, Main road', 'In Progress', '2026-01-26'),
(32, 202603, 'Electricity prb', '2 din dhore elect nai', 'Electricity', 'Mohammadpur Zone, main road,maroia corner', 'In Progress', '2026-01-27'),
(34, 2336, 'Gas Line Problem', '2/3 din dhore gas line a gas passi na', 'Other', 'Notun Bazar, A Block, Sayed Nogor', 'pending', '2026-01-29');

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
(43, 28, 'Resolved', '', '2026-01-26 23:28:04', 'Staff ID: 0'),
(44, 29, 'In Progress', '', '2026-01-26 23:44:16', 'Staff ID: 0'),
(45, 31, 'In Progress', '', '2026-01-27 01:28:08', 'Staff ID: 0'),
(46, 32, 'In Progress', '', '2026-01-27 11:41:03', 'Staff ID: 0'),
(47, 30, 'Rejected', '', '2026-01-28 07:06:55', 'Staff ID: 0');

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
(1, 'Parks & Recreation', 'parks@smartcity.gov', '01844556677', 'Park Road', 'Dhaka', 'Gulshan'),
(2, 'Roads & Transport Department', 'road.transport@smartcity.gov', '01784878475', 'Center Area', 'Dhaka', 'Mohakhali'),
(3, 'Water Supply & Sewerage', 'water.sewerage@smartcity.gov', '01354867991', 'Hospital Road', 'Dhaka', 'Rampura'),
(4, 'City Planning & Development', 'city.planning@smartcity.gov', '01758487875', 'Main Road', 'Dhaka', 'Uttora'),
(5, 'Public Safety & Emergency', 'public.safety@smartcity.gov', '01354789624', 'By Pass', 'Dhaka', 'Mohammadpur'),
(6, 'Gas supply', 'gas.suply@govt.bd', '01724474639', 'Central Mosque', 'Dhaka', 'New Market'),
(7, 'Electricity & Power', 'power@smartcity.gov', '01733445566', 'Power Station Rd', 'Dhaka', 'Badda'),
(8, 'Waste Management', 'waste@smartcity.gov', '01811223344', 'Cleaning Zone', 'Dhaka', 'Tejgaon'),
(9, 'Health Services', 'health@smartcity.gov', '01999887766', 'Medical Road', 'Dhaka', 'Dhanmondi'),
(10, 'Housing & Urban Services', 'housing@smartcity.gov', '01788990011', 'Housing Block', 'Dhaka', 'Bashundhara');

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
(23, 'Romiz', 'Uddin', 'Romiz Uddin', 'Manager', 'romiz@gmail.com', '2026-01-27', 'Active', '01854236325', 5, 6),
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
(6, 202601, 28, 3, '2026-01-26 21:59:38', 'Assigned', 'Assigned from Assign page'),
(10, 206, 29, 4, '2026-01-26 23:43:07', 'Assigned', 'Assigned from Assign page'),
(11, 202601, 31, 3, '2026-01-27 01:26:07', 'Assigned', 'Assigned from Assign page'),
(12, 3, 32, 5, '2026-01-27 11:39:52', 'Assigned', 'Assigned from Assign page'),
(13, 23, 30, 6, '2026-01-28 07:00:56', 'Assigned', 'Assigned from Assign page');

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
(23, 'Romiz Uddin', 'romiz@gmail.com', '$2y$10$B5bIKhOMEVYS.X6PSTMBn.OnzKJSGNyaSc9aU.51TIY3OIz/4O8pS', '01854236325', 'Staff', 'Active', NULL, '2026-01-27 01:33:06'),
(206, 'Sadman Hossain', 'sadman.hossain@smartcity.gov', '$2y$10$Jbd0cVvZeaZOD6.X9DZPReh0InjiO1LRDeqkW0yNLcva/..sxoVf2', '01767890123', 'Staff', 'Active', NULL, '2026-01-26 23:31:48'),
(2326, 'System Admin', 'admin', '$2y$10$720ib1T5bOnqpVh0fl0fHu4utBN8NXsZHzOLRF4lT5rCiXFuB34.2', '', 'Admin', 'Active', NULL, '2026-01-25 06:11:48'),
(2336, 'Rakib Mahamud', 'rakibmahamud@gmail.com', '$2y$10$bx0uwQ64zgKRcP8nE8wt4eWBeC5sdlD4LSMb.f/g1f3XJ537xwpQC', '01882127089', 'Citizen', 'Active', '2026-02-16 03:25:43', '2026-01-26 20:14:57'),
(202601, 'Arif Hasan', 'arif.hasan@smartcity.gov', '$2y$10$pCZ/Dm087BT3Qc6SvDCceOSEqWCKxrQ4TeemkhXOnub2rNxFVjpZq', '01712345678', 'Staff', 'Active', NULL, '2026-01-26 22:55:49'),
(202602, 'Sabbir Hossein', 'sabbirhossein@gmail.com', '$2y$10$0MWCEXo6.zPIgcZllobHs.hWKhD1YQ8RGFMVyHXJAef9.X2BenSgu', '0175824789', 'Citizen', 'Active', '2026-01-29 03:30:55', '2026-01-27 01:21:42'),
(202603, 'monali islam', 'monali@gmail.com', '$2y$10$0K2KqKneScyZd8Vg29RNUePHiDmEVCBKWFc0r9g9pxWY4fe8L9v5a', '', 'Citizen', 'Active', '2026-01-28 08:58:49', '2026-01-27 11:34:20'),
(202604, 'Mahamudul Hasan', 'mahamudulhasan@gmail.com', '$2y$10$Dv3McIY.DeNX1E.5.iRflu06UNffUCrhskDPD2B6k1xlBpltDKc2m', NULL, 'Citizen', 'Active', NULL, '2026-01-29 09:00:57');

-- --------------------------------------------------------

--
-- Table structure for table `zone`
--

CREATE TABLE `zone` (
  `zone_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `city_name` varchar(100) DEFAULT NULL,
  `area_description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `zone`
--

INSERT INTO `zone` (`zone_id`, `name`, `city_name`, `area_description`) VALUES
(1, 'Old Dhaka Zone', 'Dhaka', 'Residential area'),
(2, 'Motijheel Zone', 'Dhaka', 'Residential area'),
(3, 'Notun Bazar Zone', 'Dhaka', 'Mixed-use area'),
(4, 'Mirpur Zone', 'Dhaka', 'Residential area'),
(5, 'Dhanmondi Zone', 'Dhaka', 'Residential area'),
(6, 'Gulshan–Banani Zone', 'Dhaka', 'Residential area'),
(7, 'Mohammadpur Zone', 'Dhaka', 'Mixed-use area'),
(8, 'New Market', 'Dhaka', 'Mixed-use area'),
(9, 'Badda–Rampura Zone', 'Dhaka', 'Residential area'),
(10, 'New Market Zone', 'Dhaka', 'Mixed-use area');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `complaint`
--
ALTER TABLE `complaint`
  MODIFY `complaint_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `complaint_status`
--
ALTER TABLE `complaint_status`
  MODIFY `status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

-- AUTO_INCREMENT for table `staffassignment`
--
ALTER TABLE `staffassignment`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=202605;

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
