{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = [ pkgs.python312 pkgs.uv ];

  # PyPI wheels need these shared libraries when loaded by native Nix Python.
  LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [ pkgs.stdenv.cc.cc.lib pkgs.zlib ];
  UV_PYTHON = "${pkgs.python312}/bin/python3.12";
  UV_PYTHON_DOWNLOADS = "never";

  # Use the installed pnpm instead of downloading a generic Linux executable.
  npm_config_manage_package_manager_versions = "false";
}
