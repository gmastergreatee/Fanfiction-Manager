using System;
using System.Windows.Forms;

namespace NovelDownloader_v2
{
    public partial class SplashForm : FormWrapper
    {
        public SplashForm()
        {
            InitializeComponent();
            Icon = Properties.Resources.AppIcon;

            FormClosing += SplashForm_FormClosing;
        }

        private void SplashForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            e.Cancel = true;
            Hide();
            Globals.OnLogVerbose?.Invoke(sender, "Splash window closed");
        }
    }
}
