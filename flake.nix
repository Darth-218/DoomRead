{
  description = "DoomRead development environment (KMP core, Android Compose, Svelte web)";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/1559d3daa3ecc813a650b79375ea61b6741b8746";
  outputs = { self, nixpkgs }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" ];
      forAllSystems = f: nixpkgs.lib.genAttrs supportedSystems (system: f system);
    in {
      devShells = forAllSystems (system:
        let
          pkgs = import nixpkgs {
            inherit system;
            config.android_sdk.accept_license = true;
            config.allowUnfree = true;
          };
          androidSdk = (pkgs.androidenv.composeAndroidPackages {
            platformVersions = [ "36" ];
            buildToolsVersions = [ "36.1.0" ];
          }).androidsdk;
        in {
          default = pkgs.mkShell {
            packages = with pkgs; [ jdk21 gradle nodejs_22 androidSdk ];
            shellHook = ''
              export ANDROID_HOME="${androidSdk}"
              echo "DoomRead dev shell ready."
              echo "  JDK:     $(java -version 2>&1 | head -n1)"
              echo "  Gradle:  $(gradle --version 2>/dev/null | grep -m1 Gradle || echo 'n/a')"
              echo "  Node:    $(node --version)"
              echo "  Android: $ANDROID_HOME"
            '';
          };
        });
    };
}
