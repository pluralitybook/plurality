---
title: Gov4Git and PMP
---

# ⿻ Plural Management of ⿻ 數位 Plurality

Plurality aims to tell the world how collaborative technology can remake how we work and govern together. Yet it also aims to show these ideas working in practice, building the book according to the principles the book articulates. This is a challenge, obviously, because it is a book about innovation and thus platforms for the things we want to show do not exist: we are building them as we go in the process of writing the book! This document aims to outline for users the who, what, why, when, where and how of participating in the book’s creation.

## Goals

We have several interlocking goals in the design of our management system:
1. We want to recognize contributions and prioritize work formally, quantitatively and democratically, in contrast to the informal and often confusing methods typical in open source while at the same time...
2. We want to avoid speculation, financialization and external fungibility of this credit.
3. We want to instantiate (advanced, plural) democratic control over the direction of the project and eventually turn over maintenance of the project to the community, thereby allowing maintenance to scale as smoothly as contributions while at the same time...
4. We want to secure the system against potentially malicious attack, ensuring that this democratization and decentralization happens gradually and does not occur at the expensive of the integrity of the content to the values of the community.

A key device to jointly accomplish these goals is our system of plural credits, a non-fungible community currency of credits.

## Plural Credits

Plural credits (PCs) formally recognize contributions to the project. These will be initially fungible, quantitative and divisible indicators of extent of contribution, but not transferable across individuals and thus not saleable. Soon after we plan also to introduce qualitative tokens indicating type of contribution (e.g. writing v. design v. technical). While of no (direct) financial value, PCs will entitle holders to several social benefits:

1. __Recognition:__ Our ledger of holdings of PCs will be the definitive source of information on the effective contributions to and authorship of the book. We plan to propagate and display this in several ways, including potentially a collective image of the book’s contributors, a “credit scroll” online and in print with names listed in order or in font corresponding to PCs and in weights given to contributors in various composites representing the community created using image and voice models. Whenever we refer to the “⿻ community”, we will implicitly be referencing this ledger.
2. __Governance rights:__ As discussed further below, PCs will be the currency used for governing the book: prioritizing work on it and determining which changes/contributions should be accepted, and thus who will receive PCs in the future, as well as for making other governance decisions.
3. __Resources:__ PCs will gate access to various resources, including `@plurality.net` email addresses, GitHub Pro coupons and any other benefits (including possibly financial compensation from funds raised by book sales, all of which will be donated to the community’s collective governance) voted by the community consistent with our status as fiscally sponsored by the Open Collective Foundation, a US 501c3, thus requiring any such compensation to be reasonable, consistent with our mission and transparent.

We will shortly release a “social capitalization table” that will make the allocation of plural credits now and in the short term clear; future evolution of social capitalization will be determined collectively by the community as discussed below.

## Gov4Git

While we will initially release the social capitalization table as a simple spreadsheet, the authoritative copy of it will eventually live in a distributed ledger maintained by the community through the open-source [Gov4Git](https://gov4git.org) (G4G) protocol, a blockchain-like structure where a ledger of credits is mirrored by the git repositories of all members. In contrast to standard blockchains, however, G4G does not include financial incentives and instead relies on community members to mirror the underlying database for the same reason they mirror the code of git projects (to participate in the community) and resolves conflict through governance procedures described below.

## Plural Management Protocol

While G4G offers a substrate for an essentially-arbitrary range of governance mechanics, the mechanism we plan to implement is the [Plural Management Protocol](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4688040) (PMP), which harnesses and combines a range of the mechanisms described in the book to allow us to achieve the goals described above. While we defer the full details of the protocol to the paper, the basic idea is that contributors use their credit to prioritize work on the project as formalized by the set of GitHub issues and to approve or reject contributions/edits formalized by the set of git pull requests (PRs) to the book. They may earn credits by making contributions (having pull requests approved) and by predicting the outcome of a PR approval vote to help others triage these PRs.

Let’s break these processes down a bit more:

1. __Prioritization:__ Issues are prioritized by a version of the Capital-Constrained [Quadratic Funding](https://arxiv.org/abs/1809.06421) (QF) mechanism. Contributors dynamically contribute to proposals’ priorities and are matched according to the “democratic” QF formula (e.g. small contributions are matched more than large ones, and contributions to popular issues are matched more) and the current matching funds made available by sponsors.
2. __Subsidies:__ The matching funds are provided by sponsors, mostly likely the largest PC holders such as E. Glen Weyl and Audrey Tang.
3. __Bounties and contributions:__ The current priorities of issues are publicly displayed and ranked, so as to encourage contributors to prioritize addressing these. A contributor who submits a PR to address an issue and has this PR accepted will receive a bounty in PCs Plural Management user doc.docx proportional to this current priority (with a small “tax” to support the process of evaluating the PR).
4. __Approval votes:__ Contributors can vote for a PR to be accepted or rejected. PRs with net positive votes at the end of the review period (currently a week) will be accepted. The cost in credits of $v$ votes is $kv^2$, where $k$ is a PR-specific constant. This instantiates the system of [Quadratic Voting](https://en.wikipedia.org/wiki/Quadratic_voting#:~:text=With%20quadratic%20voting%2C%20not%20only,be%20%244%2C%20and%20so%20on.) (QV) described in the book. $k$ will typically be lower for more important PRs.
5. __Approval predictions:__ In addition to voting, contributors are also implicitly predicting what decision the community will make; in addition to the cost of $kv^2$ they will also pay a cost of $|v|$ and receive a payment of $2|v|$ if the community decides in favor of the direction of their vote. For someone who is purely maximizing their return, it is optimal to vote in the amount $\frac{|p-1/2|}{2k}$ in the direction that they believe it is more likely for the vote to go, where $p$ is the probability they believe the vote will be approved. This provides low PC-holding community members to gain PCs by helping those who may have more PCs but less time to review submissions to sort the wheat from the chaff.

## Join us!

We hope you’ll be excited to join us! You need PCs to really get into the heart of the system. The simplest way in is to submit a PR on a currently outstanding issue. Community members can also create an issue that they fund just to get you access; if your submission is approved (if the community collectively thinks you should join) you will become a member with the bounty associated with that issue. If you wish to know the current priority of issues but are not yet a member, you can contact a current member (such as [Glen Weyl](mailto:glen@plurlaity.net)). Please join our Discord channel to discuss and reach out to [Petar Maymounkov](mailto:petar@gov4git.org) if you are a translation fork or other affiliated community that wishes to use this workflow.
