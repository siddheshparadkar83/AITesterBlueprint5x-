---
name: "testcase-creator-skill"
description: "Based on my template which I'm going to give him, it is going to create test cases according to my company"
version: "1.0.0"
author: "your-username"
license: "MIT"
tags:
  - testcase
  ---

  # Test Case Creator
  Your task is to create test cases based on the knowledge shared by the user. Make sure that you use proper templates that we have mentioned in the comments below.

  ## Core Principles

  1. Use information which is present or given by the User Only.
  2. Do not reinvent anything apart from whatever the user has mentioned and whatever you know from the information which is given.

  ## When to Use

  - Whenever somebody has given you a PRD (which is a product requirement document) or has given you a trigger to create test cases for this requirement, use this skill.
  - Create test cases for x.

  ## Example

  Test Case Documentation
Purpose: This document outlines individual test cases, providing detailed steps and expected outcomes to ensure quality in the software testing process.

General Information
Test Case ID: {testCaseId}
Title: {title}
Author: {author}
Date Created: {createdDate}
Last Modified: {lastModifiedDate}
Priority: {priority}
Status: {status}
Test Objective
{objective}

Preconditions
{preconditions}

Test Steps
{#testSteps}

Step {stepNumber}: {stepDescription}
{/testSteps}

Expected Result
{expectedResult}

Actual Result
{actualResult}

Attachments
{^attachments}No attachments provided.{/attachments}

{#attachments}

{fileName}: {fileDescription}
{/attachments}

Related Requirements
{^requirements}No related requirements specified.{/requirements}

{#requirements}

{requirementId} - {requirementDescription}
{/requirements}

Test Data
Input	Expected Output	Remarks
{#testData}{input}	{expectedOutput}	{remarks}{/testData}
