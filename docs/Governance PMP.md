---
Title: Governance PMP
author:
date: 
tags:
  - 
---

# Plural Management Protocol

> While the Gov4Git protocol offers a foundational layer for an essentially-arbitrary range of governance mechanics, the governance mechanism that we plan to implement is the Plural Management Protocol (PMP). 

The PMP harnesses and combines a range of the mechanisms described in the book to allow us to achieve our goals. Full details of the PMP can be found in the [Plural Management paper](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4688040).

With the PMP, contributors can earn credits by making contributions to the book (approval of the contributors GitHub pull requests), and by helping others triage pull requests (predicting the outcome of a pull request approval vote). Contributors can then use their credits to prioritize GitHub issues, and to approve or reject GitHub pull requests. 

## Processes of the PMP

1. **Prioritization**: Issues are prioritized by a version of the Capital-Constrained [Quadratic Funding](https://arxiv.org/abs/1809.06421) (QF) mechanism. Contributors dynamically contribute to proposals’ priorities and are matched according to the “democratic” QF formula (e.g. small contributions are matched more than large ones, and contributions to popular issues are matched more) and the current matching funds made available by sponsors.
2. **Subsidies**: The matching funds are provided by sponsors, mostly likely the largest PC holders such as E. Glen Weyl and Audrey Tang.
3. **Bounties and contributions**: The current priorities of issues are publicly displayed and ranked, so as to encourage contributors to prioritize addressing these. A contributor who submits a PR to address an issue and has this PR accepted will receive a bounty in PCs Plural Management user doc.docx proportional to this current priority (with a small “tax” to support the process of evaluating the PR).
4. **Approval votes**: Contributors can vote for a PR to be accepted or rejected. PRs with net positive votes at the end of the review period (currently a week) will be accepted. The cost in credits of $v$ votes is $kv^2$ where $k$ is a PR-specific constant. This instantiates the system of [Quadratic Voting](https://en.wikipedia.org/wiki/Quadratic_voting#:~:text=With%20quadratic%20voting%2C%20not%20only,be%20%244%2C%20and%20so%20on.) (QV) described in the book.
5. **Approval predictions**: In addition to voting, contributors are also implicitly predicting what decision the community will make; in addition to the cost of $kv^2$ they will also pay a cost of $|v|$ and receive a payment of $2|v|$ if the community decides in favor of the direction of their vote. For someone who is purely maximizing their return, it is optimal to vote in the amount $\frac{|p-1/2|}{2k}$ in the direction that they believe it is more likely for the vote to go, where $p$ is the probability they believe the vote will be approved. This provides low PC-holding community members to gain PCs by helping those who may have more PCs but less time to review submissions to sort the wheat from the chaff.