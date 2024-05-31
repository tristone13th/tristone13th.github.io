---
categories: 操作系统
title: Nix Package Manager
---

Nix stores packages in the *Nix store*, usually the directory `/nix/store`, where each package has its own unique subdirectory such as `/nix/store/b6gvzjyb2pg0kjfwrjmg1vfhh54ad73z-firefox-33.1/`, (it’s a cryptographic hash of the package’s **build dependency graph**).

Nix package manager features:

- Multiple versions;
- **Multiple users**: Each user can have a different *profile*, a set of packages in the Nix store that appear in the user’s `PATH`. If a user installs a package that another user has already installed previously, the package won’t be built or downloaded a second time.

# Commands

`nix-collect-garbage`: This deletes all packages that aren’t in use by any user profile or by a currently running program.

Reference:

[The Official Documentation](https://nixos.org/manual/nix/stable/)